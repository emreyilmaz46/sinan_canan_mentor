// MentorConversationChoice.js - Conversation type selection page
import { logInfo } from '../../../shared/utils/utils.js';
import { navigateToMentorRoute } from '../MentorApp.js';

// Initialize the conversation choice interface
export async function initializeMentorConversationChoice() {
    logInfo('Initializing Mentor conversation choice interface');
    
    const container = document.getElementById('mentorContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="mentor-choice">
            <div class="mentor-choice-background"></div>
            <div class="mentor-choice-card">
                <div class="mentor-choice-header">
                    <div class="mentor-logo-small">
                        <img src="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg" alt="Prof. Dr. Sinan Canan" class="mentor-avatar-small">
                    </div>
                    <h1>Prof. Dr. Sinan Canan</h1>
                    <p class="mentor-subtitle">Nasıl konuşmak istersiniz?</p>
                </div>
                
                <div class="mentor-choice-options">
                    <button class="mentor-choice-button voice-option" id="voiceChoiceButton">
                        <div class="mentor-choice-icon">
                            <i class="fas fa-microphone"></i>
                        </div>
                        <div class="mentor-choice-content">
                            <h3>Sesli Konuşma</h3>
                            <p>Sinan Hoca ile sesli olarak konuşun</p>
                        </div>
                        <div class="mentor-choice-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </button>
                    
                    <button class="mentor-choice-button text-option" id="textChoiceButton">
                        <div class="mentor-choice-icon">
                            <i class="fas fa-keyboard"></i>
                        </div>
                        <div class="mentor-choice-content">
                            <h3>Yazılı Konuşma</h3>
                            <p>Sinan Hoca ile yazışarak konuşun</p>
                        </div>
                        <div class="mentor-choice-arrow">
                            <i class="fas fa-chevron-right"></i>
                        </div>
                    </button>
                </div>
                
                <div class="mentor-choice-footer">
                    <div class="mentor-social-links">
                        <a href="https://www.acikbeyin.com" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-globe"></i>
                            Website
                        </a>
                        <a href="https://www.instagram.com/acikbeyinegitim/" target="_blank" rel="noopener noreferrer">
                            <i class="fab fa-instagram"></i>
                            Instagram
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners
    setupMentorChoiceEventListeners();
}

// Setup event listeners for choice buttons
function setupMentorChoiceEventListeners() {
    const voiceButton = document.getElementById('voiceChoiceButton');
    const textButton = document.getElementById('textChoiceButton');
    
    // Voice option - redirect to MentorMain.js
    voiceButton.addEventListener('click', () => {
        logInfo('Sesli Konuşma selected, navigating to main');
        navigateToMentorRoute('/talk');
    });
    
    // Text option - redirect to MentorChat.js
    textButton.addEventListener('click', () => {
        logInfo('Yazılı Konuşma selected, navigating to chat');
        navigateToMentorRoute('/chat');
    });
    
    // Add hover effects
    [voiceButton, textButton].forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.classList.add('hover');
        });
        
        button.addEventListener('mouseleave', () => {
            button.classList.remove('hover');
        });
    });
}
