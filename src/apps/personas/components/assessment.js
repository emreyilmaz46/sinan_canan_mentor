// assessment.js - Handles post-simulation assessment functionality for Personas app
import { logInfo, logError, updateInteractionPrompt } from '../../../shared/utils/utils.js';
import { getSelectedPersona } from './personas.js';
import { getAuthHeaders } from '../../../shared/auth/auth.js';

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

const MAX_POLLING_ATTEMPTS = 30;
const POLLING_INTERVAL_MS = 5000;
const COMPONENT_RETRY_INTERVAL_MS = 5000;
const MAX_COMPONENT_RETRY_ATTEMPTS = 25;

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
    
    pollingAttempts = 0;
    resetComponentStatus();
    currentConversationId = null;
    
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
    
    showAssessmentLoading(true);
    
    pollingInterval = setInterval(async () => {
        pollingAttempts++;
        logInfo(`Polling attempt ${pollingAttempts}/${MAX_POLLING_ATTEMPTS}`);
        
        try {
            const conversations = await getAgentConversations(agentId);
            
            if (conversations && conversations.conversations && conversations.conversations.length > 0) {
                const latestConversationId = conversations.conversations[0].conversation_id;
                
                if (latestConversationId && latestConversationId !== initialConversationId) {
                    logInfo('New conversation found:', latestConversationId);
                    
                    currentConversationId = latestConversationId;
                    
                    clearInterval(pollingInterval);
                    pollingInterval = null;
                    
                    showAssessmentLoading(false);
                    
                    if (onNewConversationFound) {
                        onNewConversationFound(latestConversationId);
                    }
                    
                    return;
                }
            }
            
            if (pollingAttempts >= MAX_POLLING_ATTEMPTS) {
                logInfo('Maximum polling attempts reached');
                
                clearInterval(pollingInterval);
                pollingInterval = null;
                
                showAssessmentLoading(false);
                
                if (onPollingComplete) {
                    onPollingComplete(false);
                }
            }
        } catch (error) {
            logError('Error polling for conversation data:', error);
        }
    }, POLLING_INTERVAL_MS);
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
                    <p>Değerlendirme verisi hazırlanıyor, lütfen bekleyin...</p>
                </div>
            `;
            assessmentContainer.style.display = 'block';
        } else {
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
        
        const response = await fetch(`/api/conversation/${conversationId}/audio`, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
                'Range': 'bytes=0-0'
            }
        });
        
        logInfo(`Audio availability status: ${response.status}`);
        return response.ok || response.status === 206;
    } catch (error) {
        logError('Error checking audio availability:', error);
        return false;
    }
}

// Format conversation duration
function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} dakika ${remainingSeconds} saniye`;
}

// Check if a conversation has complete data
export function isConversationDataComplete(data) {
    const hasTranscript = data && data.transcript && data.transcript.length > 0;
    componentStatus.transcript = hasTranscript;
    
    const hasEvaluation = data && data.analysis && data.analysis.evaluation_criteria_results && 
                        Object.keys(data.analysis.evaluation_criteria_results).length > 0;
    componentStatus.evaluation = hasEvaluation;
    
    const hasSummary = data && data.analysis && data.analysis.transcript_summary;
    componentStatus.summary = hasSummary;
    
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
    
    const selectedPersona = getSelectedPersona();
    
    currentConversationId = conversationData.conversation_id;
    
    isConversationDataComplete(conversationData);
    
    let html = '';
    
    // Header section
    html += `
        <div class="assessment-header">
            <h3><i class="fas fa-chart-bar"></i> Simülasyon Değerlendirme Sonuçları</h3>
            <div class="assessment-meta">
                <span><i class="fas fa-clock"></i> Süre: ${formatDuration(conversationData.metadata?.call_duration_secs || 0)}</span>
            </div>
        </div>
    `;
    
    // Summary section
    html += `
        <div class="assessment-summary">
            <h4>Görüşme Özeti</h4>
            ${componentStatus.summary ? 
                `<p>${conversationData.analysis?.transcript_summary || 'Özet bulunmamaktadır.'}</p>` : 
                `<div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Özet hazırlanıyor...</div>`}
        </div>
    `;
    
    // Evaluation results section
    html += `
        <div class="assessment-results">
            <h4>Değerlendirme Kriterleri</h4>
            <div class="criteria-results">
                ${componentStatus.evaluation ? 
                    renderEvaluationCriteria(conversationData.analysis?.evaluation_criteria_results || {}) :
                    `<div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Değerlendirme kriterleri hazırlanıyor...</div>`}
            </div>
        </div>
    `;
    
    // Audio section
    html += `
        <div class="assessment-audio">
            <h4>Görüşme Kaydı</h4>
            <div id="audioContainer">
                <div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Ses kaydı hazırlanıyor...</div>
            </div>
        </div>
    `;
    
    // Transcript section
    html += `
        <div class="assessment-transcript">
            <h4>Görüşme Dökümü</h4>
            <div class="transcript-container">
                ${componentStatus.transcript ? 
                    renderTranscript(conversationData.transcript || [], selectedPersona) : 
                    `<div class="component-loading"><i class="fas fa-spinner fa-spin"></i> Görüşme dökümü hazırlanıyor...</div>`}
            </div>
        </div>
    `;
    
    assessmentContainer.innerHTML = html;
    assessmentContainer.style.display = 'block';
    
    if (!isUpdate && !isConversationDataComplete(conversationData)) {
        checkAudioAvailability(conversationData.conversation_id).then(available => {
            componentStatus.audio = available;
            
            if (available) {
                updateAudioComponent(conversationData.conversation_id);
            }
            
            startComponentPolling(conversationData.conversation_id);
        });
    } else if (componentStatus.audio && !isUpdate) {
        updateAudioComponent(conversationData.conversation_id);
    }
}

// Render evaluation criteria
function renderEvaluationCriteria(criteria) {
    let html = '';
    
    for (const [criterion, result] of Object.entries(criteria)) {
        const score = result.score || 0;
        const feedback = result.feedback || 'Geri bildirim bulunmamaktadır.';
        
        html += `
            <div class="criterion-item">
                <div class="criterion-header">
                    <h5>${criterion}</h5>
                    <span class="criterion-score">${score}/10</span>
                </div>
                <div class="criterion-feedback">
                    <p>${feedback}</p>
                </div>
            </div>
        `;
    }
    
    return html || '<p>Değerlendirme kriterleri bulunmamaktadır.</p>';
}

// Render transcript
function renderTranscript(transcript, selectedPersona) {
    if (!transcript || transcript.length === 0) {
        return '<p>Görüşme dökümü bulunmamaktadır.</p>';
    }
    
    let html = '';
    
    transcript.forEach(entry => {
        const isUser = entry.role === 'user';
        const speakerName = isUser ? 'Siz' : (selectedPersona?.name || 'AI');
        const messageClass = isUser ? 'user-message' : 'ai-message';
        
        html += `
            <div class="transcript-entry ${messageClass}">
                <div class="speaker-info">
                    <strong>${speakerName}</strong>
                    <span class="timestamp">${formatTime(entry.timestamp)}</span>
                </div>
                <div class="message-content">
                    ${entry.content || entry.text || ''}
                </div>
            </div>
        `;
    });
    
    return html;
}

// Format time
function formatTime(timestamp) {
    if (!timestamp) return '';
    
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('tr-TR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
    } catch {
        return '';
    }
}

// Additional functions (polling, audio update, etc.) would continue here...
// For brevity, I'm including the core functions needed for the assessment system

// Poll for missing components
function startComponentPolling(conversationId) {
    logInfo('Starting component polling for missing data');
    
    let retryCount = 0;
    
    const checkMissingComponents = async () => {
        retryCount++;
        logInfo(`Component polling attempt ${retryCount}/${MAX_COMPONENT_RETRY_ATTEMPTS}`);
        
        let updatedData = false;
        
        if (!componentStatus.transcript || !componentStatus.evaluation || !componentStatus.summary) {
            try {
                const conversationData = await getConversationDetails(conversationId);
                
                isConversationDataComplete(conversationData);
                
                if (componentStatus.transcript || componentStatus.evaluation || componentStatus.summary) {
                    updatedData = true;
                    renderAssessmentData(conversationData, true);
                }
            } catch (error) {
                logError('Error fetching updated conversation data:', error);
            }
        }
        
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
        
        if (updatedData) {
            logInfo('Updated assessment data components:', componentStatus);
        }
        
        if (isAllComponentsReady() || retryCount >= MAX_COMPONENT_RETRY_ATTEMPTS) {
            logInfo('Component polling complete or max retries reached');
            return;
        }
        
        setTimeout(checkMissingComponents, COMPONENT_RETRY_INTERVAL_MS);
    };
    
    setTimeout(checkMissingComponents, COMPONENT_RETRY_INTERVAL_MS);
}

// Update the audio component when audio becomes available
async function updateAudioComponent(conversationId) {
    const audioContainer = document.getElementById('audioContainer');
    if (audioContainer) {
        try {
            audioContainer.innerHTML = `
                <div class="component-loading">
                    <i class="fas fa-spinner fa-spin"></i> Ses kaydı yükleniyor...
                </div>
            `;
            
            const response = await fetch(`/api/conversation/${conversationId}/audio`, {
                method: 'GET',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${response.status}`);
            }
            
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            audioContainer.innerHTML = `
                <audio id="conversationAudio" controls>
                    <source src="${audioUrl}" type="audio/wav">
                    Tarayıcınız audio etiketini desteklemiyor.
                </audio>
            `;
            
            window.addEventListener('beforeunload', () => {
                URL.revokeObjectURL(audioUrl);
            });
            
        } catch (error) {
            logError('Error loading audio:', error);
            audioContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i> Ses kaydı yüklenemedi
                </div>
            `;
        }
    }
}

// Check if all components are ready
function isAllComponentsReady() {
    return componentStatus.transcript && componentStatus.audio && 
           componentStatus.evaluation && componentStatus.summary;
} 