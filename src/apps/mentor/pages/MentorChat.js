// MentorChat.js - Text-based conversation interface for Mentor app
import { logInfo, logError } from '../../../shared/utils/utils.js';
import { getCurrentUser, getAuthHeaders } from '../../../shared/auth/auth.js';
import { Conversation } from '@11labs/client';

// Global variables for Yazılı Konuşma
let conversation = null;
let globalAgentId = null;
let isConnecting = false;
let conversationId = null;
let isManualDisconnect = false;

// Fetch Sinan Canan agent ID from backend
async function fetchMentorAgentId() {
    try {
        const response = await fetch('/api/mentor/agent-id', {
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            globalAgentId = data.agentId;
            logInfo('Fetched Sinan Canan agent ID for text chat:', globalAgentId);
        } else {
            throw new Error('Failed to fetch agent ID');
        }
    } catch (error) {
        logError('Error fetching mentor agent ID:', error);
        // Fallback to environment-based ID if available
        globalAgentId = 'default_sinan_canan_agent';
    }
}

// Initialize the text chat interface
export async function initializeMentorChat() {
    logInfo('Initializing Mentor text chat interface');
    
    const container = document.getElementById('mentorContainer');
    if (!container) return;
    
    // Reset conversation state on initialization
    conversation = null;
    conversationId = null;
    isConnecting = false;
    isManualDisconnect = false;
    
    // Fetch agent ID first
    await fetchMentorAgentId();
    
    const user = getCurrentUser();
    
    container.innerHTML = `
        <div class="mentor-chat-container">
            <div class="mentor-chat-header">
                <button class="mentor-back-button" id="chatBackBtn">
                    <i class="fas fa-arrow-left"></i>
                </button>
                <div class="mentor-chat-avatar">
                    <img src="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg" alt="Prof. Dr. Sinan Canan">
                </div>
                <div class="mentor-chat-info">
                    <h2>Prof. Dr. Sinan Canan</h2>
                    <p class="mentor-chat-status" id="chatStatus">Bağlantı kesildi</p>
                </div>
                <button class="mentor-chat-connect-btn" id="connectBtn">
                    <i class="fas fa-plug"></i>
                    Konuşmaya Başla
                </button>
                <button class="mentor-chat-disconnect-btn" id="disconnectBtn" style="display: none;">
                    <i class="fas fa-times"></i>
                    Bağlantıyı Kes
                </button>
            </div>
            
            <div class="mentor-chat-messages" id="chatMessages">
            </div>
            
            <div class="mentor-chat-input-section" id="chatInputSection" style="display: none;">
                <div class="mentor-chat-input-container">
                    <textarea id="messageInput" placeholder="Mesajınızı yazın..." disabled rows="1"></textarea>
                    <button id="sendBtn" class="mentor-send-button" disabled>
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners
    setupMentorChatEventListeners();
}

// Setup event listeners for chat interface
function setupMentorChatEventListeners() {
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const backBtn = document.getElementById('chatBackBtn');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    
    // Connect button
    connectBtn.addEventListener('click', startTextConversation);
    
    // Disconnect button
    disconnectBtn.addEventListener('click', disconnectConversation);
    
    // Back button
    backBtn.addEventListener('click', async () => {
        // Disconnect conversation if active before navigating back
        if (conversation) {
            await disconnectConversation();
        }
        
        // Import navigateToMentorRoute dynamically to avoid circular imports
        import('../MentorApp.js').then(({ navigateToMentorRoute }) => {
            navigateToMentorRoute('/choice');
        });
    });
    
    // Send button
    sendBtn.addEventListener('click', sendMessage);
    
    // Enter key in textarea - Enter sends, Shift+Enter creates new line
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Auto-resize textarea based on content
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    });
    
    // Textarea focus/blur effects
    messageInput.addEventListener('focus', () => {
        messageInput.parentElement.classList.add('focused');
    });
    
    messageInput.addEventListener('blur', () => {
        messageInput.parentElement.classList.remove('focused');
    });
}

// Start Yazılı Konuşma
async function startTextConversation() {
    console.log('startTextConversation called');
    
    const agentId = globalAgentId;
    console.log('Agent ID:', agentId);
    
    if (!agentId) {
        addSystemMessage('Sunucudan aracı kimliği alınamadı.');
        return;
    }
    
    // Don't restart if already connected or connecting
    if (conversation || isConnecting) {
        addSystemMessage(conversation ? 'Zaten bağlısınız.' : 'Bağlantı kuruluyor.');
        return;
    }
    
    try {
        isConnecting = true;
        conversationId = null; // Reset conversation ID
        isManualDisconnect = false; // Reset manual disconnect flag
        addSystemMessage('Konuşma başlatılıyor...');
        updateConnectBtn(true);

        conversation = await Conversation.startSession({
            agentId: agentId, 
            //signedURL: signedURL,
            overrides: {
                conversation: {
                    textOnly: true,
                }
            },
            onMessage: (message) => {
                if (message.type === 'agent_response') {
                    console.log('Agent:', message.text);
                }
                console.log('Text message received:', message);
                console.log('conversation:',conversation);
                if (message.source === 'ai') {
                    displayMessage(message.message, 'agent');
                }
            },
            onError: (error) => {
                console.error('Conversation error:', error);
                addSystemMessage('Bağlantı hatası oluştu.');
                updateConnectBtn(false);
                isConnecting = false;
            },
            onClose: () => {
                logInfo('Conversation closed');
                // Store conversation ID before clearing (only if not already stored)
                if (conversation && !conversationId) {
                    conversationId = conversation.getId ? conversation.getId() : null;
                    logInfo('Chat conversation ID from onClose:', conversationId);
                }
                
                conversation = null;
                conversationId = null;
                isConnecting = false;
                
                setTimeout(() => {
                    updateConnectBtn(false);
                }, 50);
                
                // Add system message to inform user (only if not manual disconnect)
                if (!isManualDisconnect) {
                    addSystemMessage('Bağlantı sonlandırıldı.');
                }
                
                // Reset the manual disconnect flag
                isManualDisconnect = false;
            },
            onEnd: () => {
                logInfo('Conversation ended');
                conversation = null;
                conversationId = null;
                isConnecting = false;
                updateConnectBtn(false);
                // Add system message to inform user (only if not manual disconnect)
                if (!isManualDisconnect) {
                    addSystemMessage('Bağlantı sonlandırıldı.');
                }
                
                // Reset the manual disconnect flag
                isManualDisconnect = false;
            }
        });
        
        isConnecting = false;
        updateConnectBtn(true);
        
    } catch (error) {
        isConnecting = false;
        addSystemMessage(`Hata: ${error.message}`);
        console.error('Error starting Yazılı Konuşma:', error);
        conversation = null;
        updateConnectBtn(false);
    }
}

// Send message to agent
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const text = messageInput.value.trim();
    
    if (!text) return;
    
    console.log('sendMessage called');
    const agentId = globalAgentId;
    if (!agentId) {
        addSystemMessage('Aracı kimliği mevcut değil.');
        return;
    }
    
    if (!conversation) {
        addSystemMessage('Konuşma başlatılıyor...');
        await startTextConversation();
        if (!conversation) {
            addSystemMessage('Bağlantı kurulamadı. Lütfen tekrar deneyin.');
            return;
        }
    }
    
    try {
        console.log('conversation - sendMessage:', conversation);
        // Display user message
        displayMessage(text, 'user');
        
        // Clear input and reset height
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        console.log('Sending user message:', text);
        // Send to agent
        await conversation.sendUserMessage(text);
        
    } catch (error) {
        console.error('Error sending message:', error);
        addSystemMessage(`Mesaj gönderilirken hata: ${error.message}`);
        // Reset conversation on error to allow retry
        conversation = null;
        updateConnectBtn(false);
    }
}

// Display message in chat
function displayMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `mentor-chat-message ${sender}`;
    
    if (sender === 'agent') {
        messageDiv.innerHTML = `
            <div class="mentor-message-avatar">
                <img src="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg" alt="Sinan Canan">
            </div>
            <div class="mentor-message-content">
                <div class="mentor-message-text">${text}</div>
                <div class="mentor-message-time">${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="mentor-message-content">
                <div class="mentor-message-text">${text}</div>
                <div class="mentor-message-time">${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
    }
    
    // Welcome message has been removed from initial HTML, no need to remove it here
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add system message
function addSystemMessage(text) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'mentor-chat-message system';
    messageDiv.innerHTML = `
        <div class="mentor-message-content">
            <div class="mentor-message-text">${text}</div>
            <div class="mentor-message-time">${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Disconnect conversation
async function disconnectConversation() {
    logInfo('disconnectConversation called');
    if (!conversation) {
        addSystemMessage('Sonlandırılacak aktif bir konuşma yok.');
        return;
    }
    
    try {
        isManualDisconnect = true;
        addSystemMessage('Bağlantı kesiliyor...');
        
        // Store conversation ID before ending
        if (conversation.getId) {
            conversationId = conversation.getId();
            logInfo('Storing conversation ID before disconnect:', conversationId);
        }
        logInfo('Conversation ID:', conversationId);

        if (conversation) {
            try {
                await conversation.endSession();
                conversation = null;
                conversationId = null;
                isConnecting = false;
                updateConnectBtn(false);
                logInfo('Conversation ended');
                
            } catch (error) {
                logError('Error ending session:', error);
                addSystemMessage(`Oturum kapatılırken hata: ${error.message}`);
                // If endSession fails, force cleanup
                conversation = null;
                conversationId = null;
                updateConnectBtn(false);
            }
        }
        
        
    } catch (error) {
        logError('Error disconnecting conversation:', error);
        addSystemMessage(`Bağlantı kesilirken hata: ${error.message}`);
        // Force cleanup on error
        conversation = null;
        conversationId = null;
        updateConnectBtn(false);
    }
}

// Update connect button state
function updateConnectBtn(connected) {
    const connectBtn = document.getElementById('connectBtn');
    const disconnectBtn = document.getElementById('disconnectBtn');
    const chatStatus = document.getElementById('chatStatus');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const inputSection = document.getElementById('chatInputSection');
    
    if (connected) {
        connectBtn.style.display = 'none';
        disconnectBtn.style.display = 'block';
        chatStatus.textContent = 'Bağlandı';
        chatStatus.classList.add('connected');
        
        // Show input section and enable controls
        inputSection.style.display = 'block';
        messageInput.disabled = false;
        sendBtn.disabled = false;
        
        // Focus on input
        setTimeout(() => messageInput.focus(), 100);
        
    } else {
        connectBtn.style.display = 'block';
        disconnectBtn.style.display = 'none';
        chatStatus.textContent = 'Bağlantı kesildi';
        chatStatus.classList.remove('connected');
        
        // Hide input section and disable controls
        inputSection.style.display = 'none';
        messageInput.disabled = true;
        sendBtn.disabled = true;
    }
}
