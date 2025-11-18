// conversation.js - Sesli Konuşma handling
import { Conversation } from '@11labs/client';
import { 
    logInfo, 
    logError, 
    updateInteractionPrompt, 
    updateStatus, 
    updateSpeakingStatus,
    startSessionTimer,
    stopSessionTimer
} from './utils.js';
import { getSelectedPersona } from './personas.js';
import { 
    storeInitialConversationId, 
    startPollingForConversationData, 
    getConversationDetails, 
    renderAssessmentData 
} from './assessment.js';
import { getAuthHeaders } from './auth.js';

// Shared state
let conversation = null;

// Microphone access
export async function requestMicrophonePermission() {
    logInfo('Requesting microphone permission...');
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        logInfo('Microphone permission granted');
        return true;
    } catch (error) {
        logError('Microphone permission denied:', error);
        return false;
    }
}

// API interactions
export async function getSignedUrl() {
    logInfo('Fetching signed URL from backend...');
    try {
        // Get the active persona's agent ID
        const selectedPersona = getSelectedPersona();
        const agentId = selectedPersona?.agent_id;
        
        logInfo('Using agent ID for signed URL request:', agentId);
        
        // Build the request URL with the agent_id parameter if available
        let url = '/api/signed-url';
        if (agentId) {
            url += `?agent_id=${agentId}`;
        }
        
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        logInfo('Received response from backend:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to get signed URL: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        logInfo('Successfully received signed URL');
        
        // DEBUG: Log the full signed URL to console - remove in production
        console.log('%c FULL SIGNED URL (for debugging): ', 'background: #222; color: #bada55');
        console.log(data.signedUrl);
        
        return data.signedUrl;
    } catch (error) {
        logError('Error getting signed URL:', error);
        throw error;
    }
}

export async function getAgentId() {
    logInfo('Fetching agent ID from backend...');
    try {
        const response = await fetch('/api/getAgentId', {
            headers: getAuthHeaders()
        });
        const { agentId } = await response.json();
        logInfo('Received agent ID:', agentId);
        return agentId;
    } catch (error) {
        logError('Error getting agent ID:', error);
        throw error;
    }
}

// Handle disconnection event and start assessment process
function handleDisconnection(selectedPersona) {
    logInfo('Handling disconnection and starting assessment process');
    
    // Clear conversation instance
    conversation = null;
    window.conversation = null;
    
    // Stop session timer
    stopSessionTimer();
    
    // Update UI state
    updateStatus(false);
    document.getElementById('startButton').disabled = false;
    document.getElementById('endButton').disabled = true;
    updateSpeakingStatus({ mode: 'listening' });
    
    // Update prompt with loading spinner
    updateInteractionPrompt('Preparing assessment data, please wait...', true);
    
    // Start polling for the new conversation data
    if (selectedPersona && selectedPersona.agent_id) {
        startPollingForConversationData(
            selectedPersona.agent_id,
            // Called when new conversation is found
            async (newConversationId) => {
                logInfo('New conversation found, fetching details:', newConversationId);
                
                try {
                    // Get conversation details
                    const conversationData = await getConversationDetails(newConversationId);
                    
                    // Render assessment data
                    renderAssessmentData(conversationData);
                    
                    // Update prompt without spinner
                    updateInteractionPrompt('Simulation assessment completed.');
                } catch (error) {
                    logError('Error fetching conversation details:', error);
                    updateInteractionPrompt('An error occurred while retrieving assessment data.');
                }
            },
            // Called when polling is complete without finding a new conversation
            (successful) => {
                if (!successful) {
                    updateInteractionPrompt('Assessment data could not be retrieved. Please try again later.');
                }
            }
        );
    }
}

// Conversation control
export async function startConversation() {
    logInfo('Start conversation button clicked');
    
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    
    try {
        logInfo('Checking microphone permission');
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            alert('Microphone permission is required for the conversation.');
            return;
        }

        // Get the selected persona
        const selectedPersona = getSelectedPersona();
        if (!selectedPersona || !selectedPersona.agent_id) {
            alert('Please select a valid AI persona to converse with.');
            return;
        }
        
        logInfo('Selected persona for conversation:', selectedPersona);

        // Update UI to show conversation is starting
        updateInteractionPrompt(`Starting conversation with ${selectedPersona.name}...`);
        
        // Store the initial conversation ID before starting the new conversation
        await storeInitialConversationId(selectedPersona.agent_id);
        
        // Get signed URL for the conversation
        logInfo('Getting signed URL');
        const signedUrl = await getSignedUrl();
        
        logInfo('Starting conversation session with signed URL:', signedUrl.substring(0, 20) + '...');
        
        // Hide any previous assessment
        const assessmentContainer = document.querySelector('.assessment-container');
        if (assessmentContainer) {
            assessmentContainer.style.display = 'none';
        }
        
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            onConnect: () => {
                logInfo('Connected to conversation server');
                updateStatus(true);
                startButton.disabled = true;
                endButton.disabled = false;
                
                // Start session timer
                startSessionTimer();
                
                // Update prompt
                updateInteractionPrompt(`Connected! You can start talking with ${selectedPersona.name}`);
            },
            onDisconnect: () => {
                logInfo('Disconnected from conversation server');
                
                // Handle disconnection and start assessment process
                handleDisconnection(selectedPersona);
            },
            onError: (error) => {
                logError('Conversation error:', error);
                alert('An error occurred during the conversation.');
                
                // Update prompt
                updateInteractionPrompt('An error occurred. Please try again.');
            },
            onModeChange: (mode) => {
                logInfo('Mode changed:', mode);
                updateSpeakingStatus(mode);
            }
        });
        
        // Make conversation available globally for handling persona changes
        window.conversation = conversation;
        
        logInfo('Conversation session started successfully');
    } catch (error) {
        logError('Error starting conversation:', error);
        alert('Failed to start conversation. Please try again. Error: ' + error.message);
        
        // Update prompt
        updateInteractionPrompt('Simulation could not be started. Please try again.');
    }
}

export async function endConversation() {
    logInfo('End conversation button clicked');
    if (conversation) {
        try {
            // Update prompt with loading spinner
            updateInteractionPrompt('Ending simulation...', true);
            
            // Get selected persona before ending the session
            const selectedPersona = getSelectedPersona();
            
            await conversation.endSession();
            logInfo('Conversation ended successfully');
            
            // Handle disconnection and start assessment process
            handleDisconnection(selectedPersona);
        } catch (error) {
            logError('Error ending conversation:', error);
            updateInteractionPrompt('An error occurred while ending the simulation. Please try again.');
        }
    }
} 