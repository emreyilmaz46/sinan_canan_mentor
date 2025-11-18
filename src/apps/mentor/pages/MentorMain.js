// MentorMain.js - Main conversation interface for Mentor app
import { logInfo, logError, formatDuration } from '../../../shared/utils/utils.js';
import { getCurrentUser, logout, getAuthHeaders } from '../../../shared/auth/auth.js';
import { startConversationWithAgent, endConversation } from '../../../shared/conversation/conversation.js';
import { navigateToMentorRoute } from '../MentorApp.js';

// Sinan Canan agent ID - will be fetched from backend
let SINAN_CANAN_AGENT_ID = null;
let conversation_id = null;

// Conversation state
let isConversationActive = false;
let conversationStartTime = null;
let timerInterval = null;

// Sample questions for typewriter effect
const sampleQuestions = [
    "Beynin öğrenme sürecinde en kritik faktör nedir?",
    "Dijital çağda dikkati korumak için en etkili yöntem sizce hangisi?",
    "İnsan davranışını anlamada hangi bilimsel bulgu sizi en çok şaşırdı?",
    "Stresi yönetmek için günlük rutininize eklenebilecek en basit alışkanlık nedir?",
    "Gelecekte nörobilim alanında en büyük kırılmanın nerede olacağını düşünüyorsunuz?"
];

let typewriterTimeout = null;
let currentQuestionIndex = 0;
let isTypewriterRunning = false;

// Fetch Sinan Canan agent ID from backend
async function fetchMentorAgentId() {
    try {
        const response = await fetch('/api/mentor/agent-id', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            SINAN_CANAN_AGENT_ID = data.agentId;
            logInfo('Fetched Sinan Canan agent ID:', SINAN_CANAN_AGENT_ID);
        } else {
            throw new Error('Failed to fetch agent ID');
        }
    } catch (error) {
        logError('Error fetching mentor agent ID:', error);
        // Fallback to environment-based ID if available
        SINAN_CANAN_AGENT_ID = 'default_sinan_canan_agent';
    }
}

// Initialize the main mentor interface
export async function initializeMentorMain() {
    logInfo('Initializing Mentor main interface');
    
    // Clean up any existing animations first
    stopTypewriterEffect();
    
    const container = document.getElementById('mentorContainer');
    if (!container) return;
    
    // Fetch agent ID first
    await fetchMentorAgentId();
    
    const user = getCurrentUser();
    
    container.innerHTML = `
        <div class="mentor-main">
            <div class="mentor-status-bar" id="mentorStatusBar">
                <button class="mentor-back-button" id="voiceBackBtn">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="mentor-connection-status" id="mentorConnectionStatus">
                    <i class="fas fa-wifi"></i>
                    <span>Bağlantı kesildi</span>
                </div>
                <div class="mentor-timer" id="mentorTimer" style="display: none;">
                    <i class="fas fa-stopwatch"></i>
                    <span id="mentorTimerDisplay">00:00</span>
                </div>
            </div>
            
            <div class="mentor-avatar-section">
                <div class="mentor-avatar-container" id="mentorAvatarContainer">
                    <div class="mentor-avatar" id="mentorAvatar">
                        <img src="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg" alt="Prof. Dr. Sinan Canan">
                        <div class="mentor-avatar-ring"></div>
                    </div>
                    <div class="mentor-speaking-indicator" id="mentorSpeakingIndicator">
                        <div class="mentor-wave"></div>
                        <div class="mentor-wave"></div>
                        <div class="mentor-wave"></div>
                    </div>
                </div>
                
                <div class="mentor-name-section">
                    <h1>Prof. Dr. Sinan Canan</h1>
                    <p class="mentor-subtitle">Nörobilimci, Yazar, Eğitmen</p>
                    
                    <div class="mentor-sample-questions" id="mentorSampleQuestions">
                        <div class="typewriter-text" id="typewriterText"></div>
                    </div>
                </div>
                
                <div class="mentor-action-section">
                    <button class="mentor-talk-button" id="mentorTalkButton">
                        <div class="mentor-button-content">
                            <i class="fas fa-microphone"></i>
                            <span>Konuşmaya Başla</span>
                        </div>
                        <div class="mentor-button-ripple"></div>
                    </button>
                    
                    <button class="mentor-end-button" id="mentorEndButton" style="display: none;">
                        <div class="mentor-button-content">
                            <i class="fas fa-stop"></i>
                            <span>Konuşmayı Bitir</span>
                        </div>
                        <div class="mentor-button-ripple"></div>
                    </button>
                </div>
                
                <div class="mentor-status-text" id="mentorStatusText" style="display: none;">
                    <!-- Status text will be shown only during conversations -->
                </div>
            </div>
            
            <div class="mentor-quick-info">
                <div class="mentor-social-links">
                    <a href="https://www.acikbeyin.com" target="_blank" rel="noopener noreferrer" class="mentor-social-link">
                        <i class="fas fa-globe"></i>
                        <span>Website</span>
                    </a>
                    <a href="https://www.instagram.com/acikbeyinegitim/" target="_blank" rel="noopener noreferrer" class="mentor-social-link">
                        <i class="fab fa-instagram"></i>
                        <span>Instagram</span>
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners
    setupMentorEventListeners();
    
    // Initialize UI state
    updateMentorUIState('disconnected');
    
    // Start typewriter effect
    startTypewriterEffect();
}

// Stop typewriter effect
function stopTypewriterEffect() {
    if (typewriterTimeout) {
        clearTimeout(typewriterTimeout);
        typewriterTimeout = null;
    }
    isTypewriterRunning = false;
}

// Typewriter effect for sample questions
function startTypewriterEffect() {
    const typewriterElement = document.getElementById('typewriterText');
    if (!typewriterElement) return;
    
    // Stop any existing typewriter animation
    stopTypewriterEffect();
    
    // Reset state
    isTypewriterRunning = true;
    let currentText = '';
    let charIndex = 0;
    let isDeleting = false;
    const currentQuestion = sampleQuestions[currentQuestionIndex];
    
    function typeWriter() {
        // Check if animation should continue
        if (!isTypewriterRunning) return;
        
        if (!isDeleting) {
            // Typing
            currentText = currentQuestion.substring(0, charIndex + 1);
            charIndex++;
            
            if (charIndex === currentQuestion.length) {
                // Finished typing, wait then start deleting
                typewriterTimeout = setTimeout(() => {
                    if (isTypewriterRunning) {
                        isDeleting = true;
                        typeWriter();
                    }
                }, 2000);
                return;
            }
        } else {
            // Deleting
            currentText = currentQuestion.substring(0, charIndex - 1);
            charIndex--;
            
            if (charIndex === 0) {
                // Finished deleting, move to next question
                isDeleting = false;
                currentQuestionIndex = (currentQuestionIndex + 1) % sampleQuestions.length;
                typewriterTimeout = setTimeout(() => {
                    if (isTypewriterRunning) {
                        startTypewriterEffect();
                    }
                }, 500);
                return;
            }
        }
        
        // Update the display
        if (typewriterElement && isTypewriterRunning) {
            typewriterElement.innerHTML = `"${currentText}<span class="typewriter-cursor">|</span>"`;
        }
        
        // Adjust typing speed
        const typingSpeed = isDeleting ? 30 : 80;
        typewriterTimeout = setTimeout(typeWriter, typingSpeed);
    }
    
    typeWriter();
}

// Setup event listeners for mentor interface
function setupMentorEventListeners() {
    const talkButton = document.getElementById('mentorTalkButton');
    const endButton = document.getElementById('mentorEndButton');
    const backButton = document.getElementById('voiceBackBtn');
    
    // Talk button
    talkButton.addEventListener('click', startMentorConversation);
    
    // End button
    endButton.addEventListener('click', endMentorConversation);
    
    // Back button
    backButton.addEventListener('click', () => {
        navigateToMentorRoute('/choice');
    });
    
    // Add ripple effect to buttons
    talkButton.addEventListener('click', (e) => {
        createRippleEffect(e, talkButton);
    });
    
    endButton.addEventListener('click', (e) => {
        createRippleEffect(e, endButton);
    });
}

// Start mentor conversation
async function startMentorConversation() {
    console.log('startMentorConversation called');
    logInfo('Starting mentor conversation with Sinan Canan');
    
    try {
        updateMentorUIState('connecting');
        updateMentorStatus('Bağlanıyor...');
        
        // Konuşmaya Başla with Sinan Canan agent
        const conversation = await startConversationWithAgent(SINAN_CANAN_AGENT_ID, {
            onConnect: () => {
                logInfo('Connected to Sinan Canan');
                isConversationActive = true;
                conversationStartTime = Date.now();
                updateMentorUIState('connected');
                updateMentorStatus('Bağlantı tamamlandı! Konuşmaya başlayabilirsiniz.');
                startMentorTimer();
                
                // Hide sample questions during conversation
                const sampleQuestions = document.getElementById('mentorSampleQuestions');
                if (sampleQuestions) {
                    sampleQuestions.style.display = 'none';
                    // Stop typewriter animation when hiding
                    stopTypewriterEffect();
                }
            },
            onDisconnect: () => {
                logInfo('Disconnected from Sinan Canan');
                conversation_id = conversation.getId();
                logInfo('Conversation ID:', conversation_id);
                handleMentorDisconnection(conversation_id);
            },
            onError: (error) => {
                logError('Mentor conversation error:', error);
                updateMentorUIState('disconnected');
                hideMentorStatus(); // Hide status on error
                alert('Konuşma başlatılırken bir hata oluştu. Lütfen tekrar deneyin.');
            },
            onModeChange: (mode) => {
                logInfo('Mentor mode changed:', mode);
                updateMentorSpeakingState(mode.mode === 'speaking');
            }
        });
        
    } catch (error) {
        logError('Error starting mentor conversation:', error);
        updateMentorUIState('disconnected');
        hideMentorStatus(); // Hide status on error
        alert('Konuşma başlatılırken bir hata oluştu: ' + error.message);
    }
}

// End mentor conversation
async function endMentorConversation() {
    logInfo('Ending mentor conversation');
    
    try {
        updateMentorStatus('Konuşma sonlandırılıyor...');
        
        await endConversation({
            onEnd: () => {
            },
            onError: (error) => {
                logError('Error ending mentor conversation:', error);
                hideMentorStatus(); // Hide status on error
            }
        });
        
    } catch (error) {
        logError('Error ending mentor conversation:', error);
        hideMentorStatus(); // Hide status on error
    }
}

// Handle conversation disconnection
function handleMentorDisconnection(conversation_id) {
    isConversationActive = false;
    stopMentorTimer();
    updateMentorUIState('disconnected');
    updateMentorSpeakingState(false);
    hideMentorStatus(); // Hide status text when disconnected
    
    // Reset conversation start time
    if (conversationStartTime) {
        conversationStartTime = null;
    }
    
    // Show sample questions again
    const sampleQuestions = document.getElementById('mentorSampleQuestions');
    if (sampleQuestions) {
        sampleQuestions.style.display = 'block';
        // Start fresh typewriter animation
        startTypewriterEffect();
    }
    
    // Conversation ended - no automatic navigation
    logInfo('Conversation ended');
}

// Update mentor UI state
function updateMentorUIState(state) {
    const talkButton = document.getElementById('mentorTalkButton');
    const endButton = document.getElementById('mentorEndButton');
    const avatar = document.getElementById('mentorAvatar');
    const connectionStatus = document.getElementById('mentorConnectionStatus');
    const timer = document.getElementById('mentorTimer');
    
    switch (state) {
        case 'disconnected':
            talkButton.style.display = 'block';
            endButton.style.display = 'none';
            timer.style.display = 'none';
            avatar.className = 'mentor-avatar';
            connectionStatus.innerHTML = '<i class="fas fa-wifi"></i><span>Bağlantı kesildi</span>';
            connectionStatus.className = 'mentor-connection-status disconnected';
            break;
            
        case 'connecting':
            talkButton.style.display = 'none';
            endButton.style.display = 'none';
            timer.style.display = 'none';
            avatar.className = 'mentor-avatar connecting';
            connectionStatus.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Bağlanıyor...</span>';
            connectionStatus.className = 'mentor-connection-status connecting';
            break;
            
        case 'connected':
            talkButton.style.display = 'none';
            endButton.style.display = 'block';
            timer.style.display = 'block';
            avatar.className = 'mentor-avatar connected';
            connectionStatus.innerHTML = '<i class="fas fa-wifi"></i><span>Bağlandı</span>';
            connectionStatus.className = 'mentor-connection-status connected';
            break;
    }
}

// Update mentor speaking state
function updateMentorSpeakingState(isSpeaking) {
    const avatar = document.getElementById('mentorAvatar');
    const speakingIndicator = document.getElementById('mentorSpeakingIndicator');
    
    if (isSpeaking) {
        avatar.classList.add('speaking');
        speakingIndicator.classList.add('active');
        updateMentorStatus('Sinan Hoca konuşuyor...');
    } else {
        avatar.classList.remove('speaking');
        speakingIndicator.classList.remove('active');
        if (isConversationActive) {
            updateMentorStatus('Dinliyor... Şimdi konuşabilirsiniz.');
        }
    }
}

// Update status text (only show during conversations)
function updateMentorStatus(text) {
    const statusText = document.getElementById('mentorStatusText');
    if (statusText) {
        statusText.textContent = text;
        statusText.style.display = 'block';
    }
}

// Hide status text
function hideMentorStatus() {
    const statusText = document.getElementById('mentorStatusText');
    if (statusText) {
        statusText.style.display = 'none';
    }
}

// Konuşmaya Başla timer
function startMentorTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    
    const startTime = Date.now();
    
    timerInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timerDisplay = document.getElementById('mentorTimerDisplay');
        if (timerDisplay) {
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Stop conversation timer
function stopMentorTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}


// Create ripple effect for button
function createRippleEffect(event, button) {
    const ripple = button.querySelector('.mentor-button-ripple');
    if (!ripple) return;
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    ripple.classList.remove('animate');
    void ripple.offsetWidth; // Trigger reflow
    ripple.classList.add('animate');
} 