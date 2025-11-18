// conversation.js - Shared Sesli Konuşma handling for both Personas and Mentor apps
import { Conversation } from '@11labs/client';
import { 
    logInfo, 
    logError, 
    updateInteractionPrompt, 
    updateStatus, 
    updateSpeakingStatus,
    startSessionTimer,
    stopSessionTimer
} from '../utils/utils.js';
import { getAuthHeaders } from '../auth/auth.js';

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
export async function getSignedUrl(agentId = null) {
    logInfo('Fetching signed URL from backend...');
    try {
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

// Core conversation functions
export async function startConversationWithAgent(agentId, callbacks = {}) {
    logInfo('Starting conversation with agent:', agentId);
    
    try {
        logInfo('Checking microphone permission');
        const hasPermission = await requestMicrophonePermission();
        if (!hasPermission) {
            throw new Error('Microphone permission is required for the conversation.');
        }

        if (!agentId) {
            throw new Error('Agent ID is required to start conversation.');
        }
        
        // Get signed URL for the conversation
        logInfo('Getting signed URL');
        const signedUrl = await getSignedUrl(agentId);
        
        logInfo('Starting conversation session with signed URL:', signedUrl.substring(0, 20) + '...');
        
        conversation = await Conversation.startSession({
            signedUrl: signedUrl,
            onConnect: () => {
                logInfo('Connected to conversation server');
                logInfo('conversation', conversation);
                updateStatus(true);
                startSessionTimer();
                
                if (callbacks.onConnect) {
                    callbacks.onConnect();
                }
            },
            onDisconnect: () => {
                logInfo('Disconnected from conversation server');
                updateStatus(false);
                stopSessionTimer();
                // Clear conversation instance
                conversation = null;
                window.conversation = null;
                
                if (callbacks.onDisconnect) {
                    callbacks.onDisconnect();
                }
            },
            onError: (error) => {
                logError('Conversation error:', error);
                
                if (callbacks.onError) {
                    callbacks.onError(error);
                }
            },
            onModeChange: (mode) => {
                logInfo('Mode changed:', mode);
                logInfo('here', );
                logInfo('conversation', conversation);
                updateSpeakingStatus(mode);
                
                if (callbacks.onModeChange) {
                    callbacks.onModeChange(mode);
                }
            }
        });
        
        // Make conversation available globally
        window.conversation = conversation;
        
        logInfo('Conversation session started successfully with id:', conversation.getId());
        return conversation;
    } catch (error) {
        logError('Error starting conversation:', error);
        throw error;
    }
}

export async function endConversation(callbacks = {}) {
    logInfo('Ending conversation');
    if (conversation) {
        try {
            await conversation.endSession();
            logInfo('Conversation ended successfully');
            
            if (callbacks.onEnd) {
                callbacks.onEnd();
            }
        } catch (error) {
            logError('Error ending conversation:', error);
            if (callbacks.onError) {
                callbacks.onError(error);
            }
        }
    }
}

// Get current conversation instance
export function getCurrentConversation() {
    return conversation;
}

// Check if conversation is active
export function isConversationActive() {
    return !!conversation;
} 