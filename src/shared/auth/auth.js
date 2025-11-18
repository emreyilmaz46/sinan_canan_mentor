// auth.js - Shared authentication state management for both Personas and Mentor apps
import { logInfo, logError } from '../utils/utils.js';

// Authentication state
let currentUser = null;
let authToken = null;

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_info';

// Load authentication state from storage
export function loadAuthState() {
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        const user = localStorage.getItem(USER_KEY);
        
        if (token && user) {
            authToken = token;
            currentUser = JSON.parse(user);
            logInfo('Loaded auth state from storage');
            return true;
        }
    } catch (error) {
        logError('Error loading auth state:', error);
    }
    return false;
}

// Save authentication state to storage
function saveAuthState() {
    try {
        if (authToken && currentUser) {
            localStorage.setItem(TOKEN_KEY, authToken);
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
    } catch (error) {
        logError('Error saving auth state:', error);
    }
}

// Clear authentication state
export function clearAuthState() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// Login function
export async function login(username, password) {
    try {
        logInfo('Attempting login for user:', username);
        
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Login failed');
        }
        
        const data = await response.json();
        authToken = data.access_token;
        currentUser = data.user;
        
        saveAuthState();
        logInfo('Login successful for user:', username);
        
        return { success: true, user: currentUser };
    } catch (error) {
        logError('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Logout function
export async function logout() {
    try {
        // Call logout endpoint (optional)
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: getAuthHeaders()
        });
    } catch (error) {
        logError('Logout endpoint error:', error);
    }
    
    clearAuthState();
    logInfo('User logged out');
    
    // Reload the page to show login screen
    window.location.reload();
}

// Verify current token
export async function verifyToken() {
    if (!authToken) {
        return false;
    }
    
    try {
        const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            saveAuthState();
            return true;
        }
    } catch (error) {
        logError('Token verification error:', error);
    }
    
    clearAuthState();
    return false;
}

// Get authentication headers for API requests
export function getAuthHeaders() {
    const headers = {};
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// Get current user info
export function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!authToken && !!currentUser;
} 