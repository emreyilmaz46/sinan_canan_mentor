// MentorApp.js - Main entry point for the Mentor application
import { logInfo, logError } from '../../shared/utils/utils.js';
import { loadAuthState, verifyToken, getCurrentUser } from '../../shared/auth/auth.js';
import { showMentorLogin } from './components/MentorLogin.js';
import { initializeMentorMain } from './pages/MentorMain.js';
import { initializeMentorCatchup } from './pages/MentorCatchup.js';
import { initializeMentorConversationChoice } from './pages/MentorConversationChoice.js';
import { initializeMentorChat } from './pages/MentorChat.js';

// Initialize the Mentor application
export async function initializeMentorApp() {
    logInfo('Initializing Mentor application');
    
    // Replace the HTML content with mentor-specific structure
    replaceMentorHTML();
    
    // Check authentication state
    const isAuthenticated = await checkAuthentication();
    
    if (!isAuthenticated) {
        logInfo('User not authenticated, showing mentor login form');
        showMentorLogin();
        return;
    }
    
    // User is authenticated, check route or initialize conversation choice
    logInfo('User authenticated, checking route');
    
    // Handle route-based initialization
    await handleMentorRouteChange();
    
    logInfo('Mentor application initialized successfully');
}

// Replace the existing HTML with mentor-specific structure
function replaceMentorHTML() {
    document.body.innerHTML = `
        <div class="mentor-app">
            <div id="mentorContainer" class="mentor-container">
                <!-- Content will be dynamically loaded here -->
            </div>
        </div>
    `;
    
    // Update page title
    document.title = 'Sinan Hoca ile Konuş - Enocta Mentor';
    
    // Add viewport meta for mobile-first design
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
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

// Get current route within mentor app
export function getMentorRoute() {
    const path = window.location.pathname;
    return path.replace('/mentor', '') || '/';
}

// Navigate within mentor app
export function navigateToMentorRoute(route, conversationId = null) {
    const newPath = `/mentor${route}`;
    window.history.pushState({ conversationId }, '', newPath);
    
    // Trigger route change
    handleMentorRouteChange();
}

// Handle route changes within mentor app
async function handleMentorRouteChange() {
    const route = getMentorRoute();
    logInfo('Mentor route changed to:', route);
    
    switch (route) {
        case '/':
        case '/choice':
            await initializeMentorConversationChoice();
            break;
        case '/talk':
            await initializeMentorMain();
            break;
        case '/chat':
            await initializeMentorChat();
            break;
        case '/catchup':
            const state = window.history.state;
            const conversationId = state?.conversationId || null;
            await initializeMentorCatchup(conversationId);
            break;
        case '/history':
            // Will implement conversation history page
            showConversationHistory();
            break;
        default:
            // Default to conversation choice page
            await initializeMentorConversationChoice();
    }
}

// Placeholder for conversation history (Phase 4)
function showConversationHistory() {
    const container = document.getElementById('mentorContainer');
    if (container) {
        container.innerHTML = `
            <div class="mentor-history">
                <div class="mentor-header">
                    <button class="back-button" onclick="navigateToMentorRoute('/talk')">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2>Konuşma Geçmişi</h2>
                </div>
                <div class="history-content">
                    <p>Konuşma geçmişi özelliği yakında eklenecektir.</p>
                </div>
            </div>
        `;
    }
}

// Set up browser navigation handling
window.addEventListener('popstate', () => {
    handleMentorRouteChange();
});

// Handle authentication errors on API calls
window.addEventListener('unhandledrejection', function(event) {
    // Check if this is an authentication error
    if (event.reason && event.reason.message && event.reason.message.includes('401')) {
        logError('Authentication error detected in Mentor app, redirecting to login');
        showMentorLogin();
    }
});

window.addEventListener('error', function(event) {
    logError('Mentor app error:', event.error);
}); 