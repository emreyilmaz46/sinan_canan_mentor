// PersonasApp.js - Main entry point for the Personas application
import { initPersonaSystem, fetchPersonas, handlePersonaSelection } from './components/personas.js';
import { startConversation, endConversation } from './components/conversation.js';
import { logInfo, logError, updateInteractionPrompt } from '../../shared/utils/utils.js';
import { loadAuthState, verifyToken, getCurrentUser, logout } from '../../shared/auth/auth.js';
import { showLoginForm } from './components/login.js';

// Initialize the Personas application
export async function initializePersonasApp() {
    logInfo('Initializing Personas application');
    
    // Check authentication state
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
        logInfo('User not authenticated, showing login form');
        showLoginForm();
        return;
    }
    
    // User is authenticated, initialize the main app
    logInfo('User authenticated, initializing Personas app');
    
    // Add user info to the UI
    displayUserInfo();
    
    // Fetch available personas from the backend
    await fetchPersonas();
    
    // Setup event listeners
    document.getElementById('startButton').addEventListener('click', startConversation);
    document.getElementById('endButton').addEventListener('click', endConversation);
    
    // Initialize persona selection
    handlePersonaSelection();
    
    // Set initial prompt message
    updateInteractionPrompt('Lütfen bir müşteri profili seçin ve "Simülasyonu Başlat" butonuna tıklayın.');
    
    logInfo('Personas application initialized successfully');
}

// Check if user is authenticated
async function checkAuthentication() {
    // First check if we have stored auth state
    const hasStoredAuth = loadAuthState();
    
    if (!hasStoredAuth) {
        return false;
    }
    
    // Verify the token is still valid
    const isValid = await verifyToken();
    
    return isValid;
}

// Display user info in the UI
function displayUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Add user info to the sidebar
    const sessionInfo = document.querySelector('.session-info');
    if (sessionInfo) {
        // Create user info element
        const userInfoElement = document.createElement('div');
        userInfoElement.className = 'user-info';
        userInfoElement.innerHTML = `
            <p><i class="fas fa-user"></i> ${user.name}</p>
            <p class="organization"><i class="fas fa-building"></i> ${user.organization}</p>
            <button id="logoutButton" class="logout-button">
                <i class="fas fa-sign-out-alt"></i> Çıkış Yap
            </button>
        `;
        
        // Insert before session timer
        sessionInfo.insertBefore(userInfoElement, sessionInfo.firstChild);
        
        // Add logout functionality
        document.getElementById('logoutButton').addEventListener('click', () => {
            if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
                logout();
            }
        });
    }
}

// Handle authentication errors on API calls
window.addEventListener('unhandledrejection', function(event) {
    // Check if this is an authentication error
    if (event.reason && event.reason.message && event.reason.message.includes('401')) {
        logError('Authentication error detected, redirecting to login');
        // Clear auth state and reload to show login
        logout();
    }
});

window.addEventListener('error', function(event) {
    logError('Personas app error:', event.error);
}); 