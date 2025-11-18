// assessment.js - Handles post-simulation assessment functionality
import { logInfo, logError, updateInteractionPrompt } from './utils.js';
import { getSelectedPersona } from './personas.js';
import { getAuthHeaders } from './auth.js';

// State
let initialConversationId = null;
let pollingInterval = null;
let pollingAttempts = 0;
let currentConversationId = null;
let componentStatus = {
    transcript: false,
    audio: false,
    evaluation: false,
    summary: false
};

const MAX_POLLING_ATTEMPTS = 30; // Increase from 15 to 30 to give more time for audio
const POLLING_INTERVAL_MS = 5000; // Poll every 5 seconds
const COMPONENT_RETRY_INTERVAL_MS = 5000; // Check for missing components every 5 seconds
const MAX_COMPONENT_RETRY_ATTEMPTS = 25; // Increased from 10 to 25 to allow more time for audio to become available

// Store the initial conversation ID before starting a simulation
export async function storeInitialConversationId(agentId) {
    try {
        logInfo('Storing initial conversation ID');
        const conversations = await getAgentConversations(agentId);
        
        if (conversations && conversations.conversations && conversations.conversations.length > 0) {
            initialConversationId = conversations.conversations[0].conversation_id;
            logInfo('Stored initial conversation ID:', initialConversationId);
        } else {
            logInfo('No initial conversations found');
            initialConversationId = null;
        }
        
        return initialConversationId;
    } catch (error) {
        logError('Error storing initial conversation ID:', error);
        return null;
    }
}

// Start polling for conversation data
export function startPollingForConversationData(agentId, onNewConversationFound, onPollingComplete) {
    logInfo('Starting to poll for new conversation data');
    
    // Reset polling attempts and component status
    pollingAttempts = 0;
    resetComponentStatus();
    currentConversationId = null;
    
    // Clear any existing polling interval
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    // Show loading state
    showAssessmentLoading(true);
    
    // Start polling
    pollingInterval = setInterval(async () => {
        pollingAttempts++;
        logInfo(`Polling attempt ${pollingAttempts}/${MAX_POLLING_ATTEMPTS}`);
        
        try {
            const conversations = await getAgentConversations(agentId);
            
            if (conversations && conversations.conversations && conversations.conversations.length > 0) {
                const latestConversationId = conversations.conversations[0].conversation_id;
                
                // Check if we have a new conversation
                if (latestConversationId && latestConversationId !== initialConversationId) {
                    logInfo('New conversation found:', latestConversationId);
                    
                    // Store the current conversation ID
                    currentConversationId = latestConversationId;
                    
                    // Stop the main polling
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    
                    // Hide loading state
                    showAssessmentLoading(false);
                    
                    // Call callback with new conversation ID
                    if (onNewConversationFound) {
                        onNewConversationFound(latestConversationId);
                    }
                    
                    return;
                }
            }
            
            // Check if we've exceeded the maximum number of attempts
            if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
                logInfo('Maximum polling attempts reached');
                
                // Stop polling
                clearInterval(pollingInterval);
                pollingInterval = null;
                
                // Hide loading state
                showAssessmentLoading(false);
                
                // Call callback to indicate polling is complete without finding a new conversation
                if (onPollingComplete) {
                    onPollingComplete(false);
                }
            }
        } catch (error) {
            logError('Error polling for conversation data:', error);
            
            // Don't stop polling on error, just log it and continue
        }
    }, POLLING_INTERVAL_MS);
}

// Stop polling for conversation data
export function stopPollingForConversationData() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        
        // Hide loading state
        showAssessmentLoading(false);
        
        logInfo('Stopped polling for conversation data');
    }
}

// Reset component status
function resetComponentStatus() {
    componentStatus = {
        transcript: false,
        audio: false,
        evaluation: false,
        summary: false
    };
}

// Show or hide assessment loading state
function showAssessmentLoading(show) {
    const assessmentContainer = document.querySelector('.assessment-container');
    
    if (assessmentContainer) {
        if (show) {
            assessmentContainer.innerHTML = `
                <div class="assessment-loading">
                    <div class="loading-spinner">
                        <i class="fas fa-spinner fa-spin fa-3x"></i>
                    </div>
                    <p>Preparing assessment data, please wait...</p>
                </div>
            `;
            assessmentContainer.style.display = 'block';
        } else {
            // Just clear the loading indicator
            const loadingElement = assessmentContainer.querySelector('.assessment-loading');
            if (loadingElement) {
                loadingElement.remove();
            }
        }
    }
}

// Fetch conversations for an agent
export async function getAgentConversations(agentId) {
    try {
        logInfo('Fetching agent conversations:', agentId);
        
        const url = agentId ? `/api/agent-conversations?agent_id=${agentId}` : '/api/agent-conversations';
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch agent conversations: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        logError('Error fetching agent conversations:', error);
        throw error;
    }
}

// Fetch conversation details by ID
export async function getConversationDetails(conversationId) {
    try {
        logInfo('Fetching conversation details:', conversationId);
        
        const response = await fetch(`/api/conversation/${conversationId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch conversation details: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        logError('Error fetching conversation details:', error);
        throw error;
    }
}

// Check if audio is available
export async function checkAudioAvailability(conversationId) {
    try {
        logInfo('Checking audio availability for conversation:', conversationId);
        
        // Use a GET request with range header instead of HEAD to avoid 405 errors
        // We only request the first byte to check if the audio is available
        const response = await fetch(`/api/conversation/${conversationId}/audio`, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
                'Range': 'bytes=0-0' // Request only the first byte
            }
        });
        
        logInfo(`Audio availability status: ${response.status}`);
        return response.ok || response.status === 206; // 206 is Partial Content for range requests
    } catch (error) {
        logError('Error checking audio availability:', error);
        return false;
    }
}

// Format conversation duration
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} minutes ${remainingSeconds} seconds`;
}

// Check if a conversation has complete data
export function isConversationDataComplete(data) {
    // Check if transcript exists and has entries
    const hasTranscript = data && data.transcript && data.transcript.length > 0;
    componentStatus.transcript = hasTranscript;
    
    // Check if evaluation results exist
    const hasEvaluation = data && data.analysis && data.analysis.evaluation_criteria_results && 
                        Object.keys(data.analysis.evaluation_criteria_results).length > 0;
    componentStatus.evaluation = hasEvaluation;
    
    // Check if summary exists
    const hasSummary = data && data.analysis && data.analysis.transcript_summary;
    componentStatus.summary = hasSummary;
    
    // Audio is checked separately
    
    logInfo('Conversation data status:', componentStatus);
    
    return componentStatus.transcript && componentStatus.audio && 
           componentStatus.evaluation && componentStatus.summary;
}

// Render the assessment data in the UI
export function renderAssessmentData(conversationData, isUpdate = false) {
    logInfo('Rendering assessment data, isUpdate:', isUpdate);
    
    const assessmentContainer = document.querySelector('.assessment-container');
    
    if (!assessmentContainer || !conversationData) {
        logError('Assessment container or conversation data not found');
        return;
    }
    
    // Get the selected persona for customizing the transcript display
    const selectedPersona = getSelectedPersona();
    
    // Store the current conversation ID
    currentConversationId = conversationData.conversation_id;
    
    // Check component status (except audio, which we'll check separately)
    isConversationDataComplete(conversationData);
    
    // Create the HTML structure
    let html = '';
    
    // Header section
    html += `
        <div class="assessment-header">
            <h3><i class="fas fa-chart-bar"></i> Simulation Assessment Results</h3>
            <div class="assessment-meta">
                <span><i class="fas fa-clock"></i> Duration: ${formatDuration(conversationData.metadata?.call_duration_secs || 0)}</span>
            </div>
        </div>
    `;
    
    // Summary section
    html += `
        <div class="assessment-summary">
            <h4>Conversation Summary</h4>
            ${componentStatus.summary ? 
                `<p>${conversationData.analysis?.transcript_summary || 'Summary not available.'}</p>` : 
                `<div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Preparing summary...</div>`}
        </div>
    `;
    
    // Evaluation results section - moved up before audio
    html += `
        <div class="assessment-results">
            <h4>Evaluation Criteria</h4>
            <div class="criteria-results">
                ${componentStatus.evaluation ? 
                    renderEvaluationCriteria(conversationData.analysis?.evaluation_criteria_results || {}) :
                    `<div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Preparing evaluation criteria...</div>`}
            </div>
        </div>
    `;
    
    // Audio section - moved down to be closer to transcript
    html += `
        <div class="assessment-audio">
            <h4>Conversation Recording</h4>
            <div id="audioContainer">
                <div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Preparing audio recording...</div>
            </div>
        </div>
    `;
    
    // Transcript section
    html += `
        <div class="assessment-transcript">
            <h4>Conversation Transcript</h4>
            <div class="transcript-container">
                ${componentStatus.transcript ? 
                    renderTranscript(conversationData.transcript || [], selectedPersona) : 
                    `<div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Preparing conversation transcript...</div>`}
            </div>
        </div>
    `;
    
    // Update the container
    assessmentContainer.innerHTML = html;
    
    // Show the assessment container
    assessmentContainer.style.display = 'block';
    
    // If not all components are ready, start polling for the missing ones
    if (!isUpdate && !isConversationDataComplete(conversationData)) {
        // Check audio availability separately
        checkAudioAvailability(conversationData.conversation_id).then(available => {
            componentStatus.audio = available;
            
            // If audio is available, update the audio component
            if (available) {
                updateAudioComponent(conversationData.conversation_id);
            }
            
            // Start polling for missing components
            startComponentPolling(conversationData.conversation_id);
        });
    } else if (componentStatus.audio && !isUpdate) {
        // If audio is already available, load it immediately
        updateAudioComponent(conversationData.conversation_id);
    }
}

// Poll for missing components
function startComponentPolling(conversationId) {
    logInfo('Starting component polling for missing data');
    
    let retryCount = 0;
    
    const checkMissingComponents = async () => {
        retryCount++;
        logInfo(`Component polling attempt ${retryCount}/${MAX_COMPONENT_RETRY_ATTEMPTS}`);
        
        let updatedData = false;
        
        // Check if we need to update any components
        if (!componentStatus.transcript || !componentStatus.evaluation || !componentStatus.summary) {
            try {
                // Fetch the latest conversation data
                const conversationData = await getConversationDetails(conversationId);
                
                // Update the component status
                isConversationDataComplete(conversationData);
                
                // If any component has been updated, render the updated data
                if (componentStatus.transcript || componentStatus.evaluation || componentStatus.summary) {
                    updatedData = true;
                    renderAssessmentData(conversationData, true);
                }
            } catch (error) {
                logError('Error fetching updated conversation data:', error);
            }
        }
        
        // Check audio availability separately
        if (!componentStatus.audio) {
            try {
                const audioAvailable = await checkAudioAvailability(conversationId);
                if (audioAvailable) {
                    componentStatus.audio = true;
                    updatedData = true;
                    updateAudioComponent(conversationId);
                }
            } catch (error) {
                logError('Error checking audio availability:', error);
            }
        }
        
        // If we've updated any component, log it
        if (updatedData) {
            logInfo('Updated assessment data components:', componentStatus);
        }
        
        // Check if all components are now available or we've reached max retries
        if (isAllComponentsReady() || retryCount >= MAX_COMPONENT_RETRY_ATTEMPTS) {
            logInfo('Component polling complete or max retries reached');
            if (!isAllComponentsReady()) {
                showMissingComponentsMessage();
            }
            return;
        }
        
        // Continue polling
        setTimeout(checkMissingComponents, COMPONENT_RETRY_INTERVAL_MS);
    };
    
    // Start the first check
    setTimeout(checkMissingComponents, COMPONENT_RETRY_INTERVAL_MS);
}

// Update the audio component when audio becomes available
async function updateAudioComponent(conversationId) {
    const audioContainer = document.getElementById('audioContainer');
    if (audioContainer) {
        try {
            // Show loading state
            audioContainer.innerHTML = `
                <div class="component-loading">
                    <i class="fas fa-spinner fa-spin"></i> Loading audio recording...
                </div>
            `;
            
            // Fetch audio data with authentication headers
            const response = await fetch(`/api/conversation/${conversationId}/audio`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${response.status}`);
            }
            
            // Get the audio data as a blob
            const audioBlob = await response.blob();
            
            // Create a blob URL
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Update the audio container with the blob URL
            audioContainer.innerHTML = `
                <audio id="conversationAudio" controls>
                    <source src="${audioUrl}" type="audio/wav">
                    Your browser does not support the audio tag.
                </audio>
            `;
            
            // Clean up the blob URL when the page unloads
            window.addEventListener('beforeunload', () => {
                URL.revokeObjectURL(audioUrl);
            });
            
        } catch (error) {
            logError('Error loading audio:', error);
            audioContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i> Audio recording could not be loaded
                </div>
            `;
        }
    }
}

// Show message for missing components
function showMissingComponentsMessage() {
    // For each component that's still missing, update the loading spinner to an error message
    const components = [
        { name: 'transcript', selector: '.assessment-transcript .component-loading', message: 'Conversation transcript is currently unavailable.' },
        { name: 'audio', selector: '#audioContainer .component-loading', message: 'Audio recording is currently unavailable.' },
        { name: 'evaluation', selector: '.assessment-results .component-loading', message: 'Evaluation criteria are currently unavailable.' },
        { name: 'summary', selector: '.assessment-summary .component-loading', message: 'Summary is currently unavailable.' }
    ];
    
    components.forEach(component => {
        if (!componentStatus[component.name]) {
            const element = document.querySelector(component.selector);
            if (element) {
                element.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${component.message}`;
                element.classList.add('component-error');
            }
        }
    });
}

// Check if all components are ready
function isAllComponentsReady() {
    return componentStatus.transcript && componentStatus.audio && 
           componentStatus.evaluation && componentStatus.summary;
}

// Render evaluation criteria
function renderEvaluationCriteria(criteria) {
    if (!criteria || Object.keys(criteria).length === 0) {
        return '<p>Evaluation criteria are not available.</p>';
    }
    
    return Object.entries(criteria).map(([key, criterion]) => {
        const isSuccess = criterion.result === 'success';
        const statusClass = isSuccess ? 'success' : 'failure';
        const statusIcon = isSuccess ? 'fa-check-circle' : 'fa-times-circle';
        
        return `
            <div class="criterion ${statusClass}">
                <div class="criterion-header">
                    <h5>${key}</h5>
                    <span class="criterion-result">
                        <i class="fas ${statusIcon}"></i>
                        ${isSuccess ? 'Successful' : 'Failed'}
                    </span>
                </div>
                <p>${criterion.rationale || 'Explanation not available.'}</p>
            </div>
        `;
    }).join('');
}

// Render conversation transcript
function renderTranscript(transcript, selectedPersona) {
    if (!transcript || transcript.length === 0) {
        return '<p>Conversation transcript is not available.</p>';
    }
    
    return transcript.map((message, index) => {
        // Skip messages with no content or tool calls only
        if (!message.message && (!message.tool_calls || message.tool_calls.length === 0)) {
            return '';
        }
        
        const isUser = message.role === 'user';
        const messageClass = isUser ? 'user-message' : 'agent-message';
        
        // For agent messages, use the persona's image if available
        let avatarContent = '';
        if (isUser) {
            avatarContent = `<i class="fas fa-user"></i>`;
        } else if (selectedPersona && selectedPersona.image) {
            avatarContent = `<img src="${selectedPersona.image}" alt="${selectedPersona.name}">`;
        } else {
            // Fallback to robot icon if no persona image is available
            avatarContent = `<i class="fas fa-robot"></i>`;
        }
        
        return `
            <div class="transcript-message ${messageClass}">
                <div class="message-avatar">
                    ${avatarContent}
                </div>
                <div class="message-content">
                    <div class="message-header">
                        <span class="message-role">${isUser ? 'User' : selectedPersona?.name || 'AI'}</span>
                        <span class="message-time">${message.time_in_call_secs ? formatTime(message.time_in_call_secs) : ''}</span>
                    </div>
                    <p>${message.message || ''}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Format time for transcript
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
} 