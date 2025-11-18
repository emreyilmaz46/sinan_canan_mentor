// login.js - Login interface component
import { login } from './auth.js';
import { logInfo, logError } from './utils.js';

// Create and display the login form
export function showLoginForm() {
    logInfo('Showing login form');
    
    // Create login overlay
    const loginOverlay = document.createElement('div');
    loginOverlay.className = 'login-overlay';
    loginOverlay.innerHTML = `
        <div class="login-container">
            <div class="login-header">
                <h2>Enocta Personas</h2>
                <p>Role-Playing and Simulation System</p>
            </div>
            
            <form id="loginForm" class="login-form">
                <div class="form-group">
                    <label for="username">
                        <i class="fas fa-user"></i>
                        Username
                    </label>
                    <input 
                        type="text" 
                        id="username" 
                        name="username" 
                        required 
                        autocomplete="username"
                        placeholder="Enter your username"
                    >
                </div>
                
                <div class="form-group">
                    <label for="password">
                        <i class="fas fa-lock"></i>
                        Password
                    </label>
                    <input 
                        type="password" 
                        id="password" 
                        name="password" 
                        required 
                        autocomplete="current-password"
                        placeholder="Enter your password"
                    >
                </div>
                
                <div class="error-message" id="loginError" style="display: none;"></div>
                
                <button type="submit" class="login-button">
                    <i class="fas fa-sign-in-alt"></i>
                    Sign In
                </button>
            </form>
            
            <div class="login-footer">
                <p>© 2025 Enocta | All rights reserved</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(loginOverlay);
    
    // Focus on username field
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
    
    // Handle form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', handleLoginSubmit);
}

// Hide the login form
export function hideLoginForm() {
    const loginOverlay = document.querySelector('.login-overlay');
    if (loginOverlay) {
        loginOverlay.remove();
    }
}

// Handle login form submission
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const errorElement = document.getElementById('loginError');
    
    // Get form values
    const username = form.username.value.trim();
    const password = form.password.value;
    
    // Clear previous error
    clearErrorMessage(errorElement);
    
    // Disable form during submission
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    
    try {
        // Attempt login
        const result = await login(username, password);
        
        if (result.success) {
            logInfo('Login successful, reloading page');
            // Hide login form
            hideLoginForm();
            
            // Reload the page to initialize the main app
            window.location.reload();
        } else {
            // Show error message
            showErrorMessage(errorElement, result.error || 'Login failed');
            
            // Shake the form
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
            
            // Focus on password field
            form.password.focus();
            form.password.select();
        }
    } catch (error) {
        logError('Login error:', error);
        showErrorMessage(errorElement, 'An error occurred. Please try again.');
    } finally {
        // Re-enable form
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
}

// Helper function to show error message
function showErrorMessage(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.classList.add('show');
}

// Helper function to clear error message
function clearErrorMessage(errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
    errorElement.classList.remove('show');
}

// Check if user is on login page
export function isLoginPageVisible() {
    return document.querySelector('.login-overlay') !== null;
} 