// utils.js - Shared helper functions

// Logging functions
export function logInfo(message, data) {
    console.log(`[INFO] ${message}`, data || '');
}

export function logError(message, error) {
    console.error(`[ERROR] ${message}`, error || '');
    if (error && error.stack) {
        console.error(`[ERROR STACK] ${error.stack}`);
    }
}

// Timer utilities
let sessionTimer = null;
let sessionSeconds = 0;

// Format time for session timer display
export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Start session timer
export function startSessionTimer() {
    sessionSeconds = 0;
    updateSessionTime();
    sessionTimer = setInterval(() => {
        sessionSeconds++;
        updateSessionTime();
    }, 1000);
}

// Stop session timer
export function stopSessionTimer() {
    if (sessionTimer) {
        clearInterval(sessionTimer);
        sessionTimer = null;
    }
}

// Update session time display
export function updateSessionTime() {
    const timeElement = document.getElementById('sessionTime');
    if (timeElement) {
        timeElement.textContent = formatTime(sessionSeconds);
    }
}

// DOM interaction utilities
export function updateInteractionPrompt(message, showSpinner = false) {
    const promptElement = document.getElementById('interactionPrompt');
    if (promptElement) {
        if (showSpinner) {
            promptElement.innerHTML = `
                <div class="loading-spinner-container">
                    <div class="loading-circle"></div>
                </div>
                <span>${message}</span>
            `;
            promptElement.classList.add('with-spinner');
        } else {
            promptElement.textContent = message;
            promptElement.classList.remove('with-spinner');
        }
    }
}

// Activate audio visualizer
export function activateVisualizer(active) {
    const visualizer = document.querySelector('.audio-visualizer');
    if (visualizer) {
        visualizer.classList.toggle('active', active);
    }
    
    // Also update the interaction prompt styling
    const promptElement = document.getElementById('interactionPrompt');
    if (promptElement) {
        promptElement.classList.toggle('speaking', active);
    }
    
    // Update the visualizer container
    const visualizerContainer = document.querySelector('.visualizer-container');
    if (visualizerContainer) {
        if (active) {
            visualizerContainer.style.backgroundColor = 'rgba(227, 242, 253, 0.3)';
            visualizerContainer.style.boxShadow = '0 4px 12px rgba(21, 101, 192, 0.1)';
        } else {
            visualizerContainer.style.backgroundColor = 'rgba(0,0,0,0.02)';
            visualizerContainer.style.boxShadow = 'none';
        }
    }
}

// Status update utilities
export function updateStatus(isConnected) {
    logInfo('Updating connection status:', isConnected ? 'Connected' : 'Disconnected');
    const statusElement = document.getElementById('connectionStatus');
    statusElement.innerHTML = isConnected ? 
        '<i class="fas fa-plug"></i> Connected' : 
        '<i class="fas fa-plug"></i> Connection Lost';
    statusElement.classList.toggle('connected', isConnected);
    
    // Additional visual feedback
    if (isConnected) {
        statusElement.style.transform = 'translateY(2px)';
        setTimeout(() => {
            statusElement.style.transform = 'translateY(0)';
        }, 300);
    }
}

export function updateSpeakingStatus(mode) {
    const statusElement = document.getElementById('speakingStatus');
    // Update based on the exact mode string we receive
    const isSpeaking = mode.mode === 'speaking';
    
    statusElement.innerHTML = isSpeaking ? 
        '<i class="fas fa-microphone-alt"></i> AI Speaking' : 
        '<i class="fas fa-microphone-alt"></i> AI Silent';
    
    statusElement.classList.toggle('speaking', isSpeaking);
    
    // Additional visual feedback for status change
    statusElement.style.transform = 'translateY(2px)';
    setTimeout(() => {
        statusElement.style.transform = 'translateY(0)';
    }, 300);
    
    // Update visualizer based on speaking status
    activateVisualizer(isSpeaking);
    
    // Update interaction prompt with appropriate message and styling
    const message = isSpeaking ? 
        'AI Speaking' : 
        'You Can Speak Now';
    
    updateInteractionPrompt(message);
    
    logInfo('Speaking status updated:', mode);
} 