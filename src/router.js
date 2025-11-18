// router.js - App routing logic for multi-app architecture
import { logInfo, logError } from './shared/utils/utils.js';

// App type detection based on current URL
export function detectAppType() {
    const path = window.location.pathname;
    
    if (path.startsWith('/mentor')) {
        return 'mentor';
    }
    
    return 'personas';
}

// Initialize the appropriate app based on route
export async function initializeApp() {
    const appType = detectAppType();
    logInfo(`Initializing app type: ${appType}`);
    
    try {
        if (appType === 'mentor') {
            // Dynamic import of mentor app
            const { initializeMentorApp } = await import('./apps/mentor/MentorApp.js');
            await initializeMentorApp();
        } else {
            // Dynamic import of personas app
            const { initializePersonasApp } = await import('./apps/personas/PersonasApp.js');
            await initializePersonasApp();
        }
    } catch (error) {
        logError('Error initializing app:', error);
        // Fallback to personas app
        if (appType === 'mentor') {
            window.location.href = '/';
        }
    }
}

// Navigation utilities
export function navigateToPersonas() {
    window.location.href = '/';
}

export function navigateToMentor(route = '') {
    window.location.href = `/mentor/${route}`;
}

// Route change handler for SPA navigation within each app
export function handleRouteChange(callback) {
    window.addEventListener('popstate', callback);
}

// Get current route within the app
export function getCurrentRoute() {
    const path = window.location.pathname;
    const appType = detectAppType();
    
    if (appType === 'mentor') {
        return path.replace('/mentor', '') || '/';
    }
    
    return path || '/';
} 