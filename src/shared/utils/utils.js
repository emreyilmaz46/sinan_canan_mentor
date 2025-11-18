// utils.js - Shared utility functions for both Personas and Mentor apps
// Session timer state
let sessionStartTime = null;
let sessionTimerInterval = null;
let sessionTimerElement = null;

// Status update functions
export function updateStatus(connected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        if (connected) {
            statusElement.className = 'status-badge connected';
            statusElement.innerHTML = '<i class="fas fa-plug"></i> Bağlantı Kuruldu';
        } else {
            statusElement.className = 'status-badge disconnected';
            statusElement.innerHTML = '<i class="fas fa-plug"></i> Bağlantı Kesildi';
        }
    }
}

export function updateSpeakingStatus(mode) {
    const speakingElement = document.getElementById('speakingStatus');
    if (speakingElement) {
        if (mode.mode === 'speaking') {
            speakingElement.className = 'status-badge speaking';
            speakingElement.innerHTML = '<i class="fas fa-microphone-alt"></i> Yapay Zeka Konuşuyor';
        } else {
            speakingElement.className = 'status-badge listening';
            speakingElement.innerHTML = '<i class="fas fa-microphone-alt"></i> Yapay Zeka Sessiz';
        }
    }
}

export function updateInteractionPrompt(message, showSpinner = false) {
    const promptElement = document.getElementById('interactionPrompt');
    if (promptElement) {
        if (showSpinner) {
            promptElement.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
        } else {
            promptElement.textContent = message;
        }
    }
}

// Session timer functions
export function startSessionTimer() {
    sessionStartTime = Date.now();
    sessionTimerElement = document.getElementById('sessionTime');
    
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
    }
    
    sessionTimerInterval = setInterval(updateSessionTimer, 1000);
    updateSessionTimer();
}

export function stopSessionTimer() {
    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
        sessionTimerInterval = null;
    }
}

function updateSessionTimer() {
    if (!sessionStartTime || !sessionTimerElement) return;
    
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    sessionTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Logging functions
export function logInfo(message, ...args) {
    console.log(`[INFO] ${message}`, ...args);
}

export function logError(message, ...args) {
    console.error(`[ERROR] ${message}`, ...args);
}

export function logWarning(message, ...args) {
    console.warn(`[WARNING] ${message}`, ...args);
}

// Date formatting utilities
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes} dk ${remainingSeconds} sn`;
    }
    return `${remainingSeconds} sn`;
}

// Storage utilities
export function getFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        logError('Error getting from storage:', error);
        return defaultValue;
    }
}

export function setToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        logError('Error setting to storage:', error);
        return false;
    }
}

export function removeFromStorage(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        logError('Error removing from storage:', error);
        return false;
    }
}

// DOM utilities
export function createElement(tag, className = '', innerHTML = '') {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (innerHTML) {
        element.innerHTML = innerHTML;
    }
    return element;
}

export function hideElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = 'none';
    }
}

export function showElement(selector, display = 'block') {
    const element = document.querySelector(selector);
    if (element) {
        element.style.display = display;
    }
}

// Animation utilities
export function addSpinnerToElement(element, message = '') {
    if (element) {
        element.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${message}`;
    }
}

export function removeSpinnerFromElement(element, newContent = '') {
    if (element) {
        element.innerHTML = newContent;
    }
} 