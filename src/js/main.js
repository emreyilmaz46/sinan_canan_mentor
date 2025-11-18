// main.js - Application entry point
import { initPersonaSystem, fetchPersonas, handlePersonaSelection } from './personas.js';
import { startConversation, endConversation } from './conversation.js';
import { logInfo, logError, updateInteractionPrompt } from './utils.js';
import { loadAuthState, verifyToken, getCurrentUser, logout } from './auth.js';
import { showLoginForm } from './login.js';

// Initialize the application
async function initializeApp() {
    logInfo('Initializing application');
    
    // Check authentication state
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
        logInfo('User not authenticated, showing login form');
        showLoginForm();
        return;
    }
    
    // User is authenticated, initialize the main app
    logInfo('User authenticated, initializing main app');
    
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
    updateInteractionPrompt('Please select a customer profile and click the "Start Simulation" button.');
    
    logInfo('Application initialized successfully');
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
                <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
        `;
        
        // Insert before session timer
        sessionInfo.insertBefore(userInfoElement, sessionInfo.firstChild);
        
        // Add logout functionality
        document.getElementById('logoutButton').addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out?')) {
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

// Ensure DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);

window.addEventListener('error', function(event) {
    logError('Global error:', event.error);
}); 