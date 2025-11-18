// conversation.js - Sesli Konuşma handling for Personas app
import { 
    logInfo, 
    logError, 
    updateInteractionPrompt
} from '../../../shared/utils/utils.js';
import { startConversationWithAgent, endConversation as endSharedConversation } from '../../../shared/conversation/conversation.js';
import { getSelectedPersona } from './personas.js';
import { 
    storeInitialConversationId, 
    startPollingForConversationData, 
    getConversationDetails, 
    renderAssessmentData 
} from './assessment.js';

// Handle disconnection event and start assessment process
function handleDisconnection(selectedPersona) {
    logInfo('Handling disconnection and starting assessment process');
    
    // Update UI state
    document.getElementById('startButton').disabled = false;
    document.getElementById('endButton').disabled = true;
    
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
    logInfo('Start conversation button clicked for Personas app');
    
    const startButton = document.getElementById('startButton');
    const endButton = document.getElementById('endButton');
    
    try {
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
        
        // Hide any previous assessment
        const assessmentContainer = document.querySelector('.assessment-container');
        if (assessmentContainer) {
            assessmentContainer.style.display = 'none';
        }
        
        // Start conversation using shared conversation handler
        await startConversationWithAgent(selectedPersona.agent_id, {
            onConnect: () => {
                startButton.disabled = true;
                endButton.disabled = false;
                updateInteractionPrompt(`Connected! You can start talking with ${selectedPersona.name}`);
            },
            onDisconnect: () => {
                handleDisconnection(selectedPersona);
            },
            onError: (error) => {
                alert('An error occurred during the conversation.');
                updateInteractionPrompt('An error occurred. Please try again.');
            }
        });
        
        logInfo('Conversation session started successfully');
    } catch (error) {
        logError('Error starting conversation:', error);
        alert('Failed to start conversation. Please try again. Error: ' + error.message);
        updateInteractionPrompt('Simulation could not be started. Please try again.');
    }
}

export async function endConversation() {
    logInfo('End conversation button clicked for Personas app');
    
    try {
        // Update prompt with loading spinner
        updateInteractionPrompt('Ending simulation...', true);
        
        // Get selected persona before ending the session
        const selectedPersona = getSelectedPersona();
        
        // End conversation using shared handler
        await endSharedConversation({
            onEnd: () => {
                handleDisconnection(selectedPersona);
            },
            onError: (error) => {
                updateInteractionPrompt('An error occurred while ending the simulation. Please try again.');
            }
        });
    } catch (error) {
        logError('Error ending conversation:', error);
        updateInteractionPrompt('An error occurred while ending the simulation. Please try again.');
    }
} 