// login.js - Login interface for Personas app
import { login } from '../../../shared/auth/auth.js';
import { logInfo, logError } from '../../../shared/utils/utils.js';

// Show login form
export function showLoginForm() {
    logInfo('Showing login form for Personas app');
    
    // Hide the main app content
    const appContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    
    if (appContent) {
        appContent.style.display = 'none';
    }
    if (sidebar) {
        sidebar.style.display = 'none';
    }
    
    // Create login container
    const loginContainer = document.createElement('div');
    loginContainer.className = 'login-container';
    loginContainer.innerHTML = `
        <div class="login-card">
            <div class="login-header">
                <img src="https://ik.imagekit.io/emreyz/Enocta_Yeni_Logo.png?updatedAt=1748956800455" alt="Enocta Logo" class="login-logo">
                <h2>Enocta Personas</h2>
                <p>Professional role-playing simulation platform</p>
            </div>
            <form id="loginForm" class="login-form">
                <div class="form-group">
                    <label for="username">Username</label>
                    <input type="text" id="username" name="username" required autocomplete="username">
                </div>
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password">
                </div>
                <button type="submit" class="login-button">
                    <span id="loginButtonText">Sign In</span>
                    <i id="loginSpinner" class="fas fa-spinner fa-spin" style="display: none;"></i>
                </button>
                <div id="loginError" class="error-message" style="display: none;"></div>
            </form>
            <div class="login-footer">
                <p>© 2024 Enocta. All rights reserved.</p>
            </div>
        </div>
    `;
    
    // Add to body
    document.body.appendChild(loginContainer);
    
    // Setup form submission
    setupLoginForm();
    
    // Focus on username field
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

// Setup login form event handlers
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginButton = document.querySelector('.login-button');
    const loginButtonText = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');
    
    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showLoginError('Please enter your username and password.');
            return;
        }
        
        // Show loading state
        setLoginLoading(true);
        hideLoginError();
        
        try {
            const result = await login(username, password);
            
            if (result.success) {
                logInfo('Login successful, reloading page');
                // Reload the page to reinitialize the app
                window.location.reload();
            } else {
                throw new Error(result.error || 'Login failed');
            }
        } catch (error) {
            logError('Login error:', error);
            showLoginError(error.message || 'An error occurred while signing in.');
            setLoginLoading(false);
        }
    });
    
    // Enter key handling
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
    
    // Input validation
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            hideLoginError();
        });
    });
    
    function setLoginLoading(loading) {
        loginButton.disabled = loading;
        loginButtonText.style.display = loading ? 'none' : 'inline';
        loginSpinner.style.display = loading ? 'inline' : 'none';
        
        if (loading) {
            loginButton.classList.add('loading');
        } else {
            loginButton.classList.remove('loading');
        }
    }
    
    function showLoginError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        
        // Add shake animation
        loginError.classList.add('shake');
        setTimeout(() => {
            loginError.classList.remove('shake');
        }, 500);
    }
    
    function hideLoginError() {
        loginError.style.display = 'none';
    }
}

// Hide login form (when user is authenticated)
export function hideLoginForm() {
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
        loginContainer.remove();
    }
    
    // Show the main app content
    const appContent = document.querySelector('.main-content');
    const sidebar = document.querySelector('.sidebar');
    
    if (appContent) {
        appContent.style.display = 'block';
    }
    if (sidebar) {
        sidebar.style.display = 'block';
    }
} 