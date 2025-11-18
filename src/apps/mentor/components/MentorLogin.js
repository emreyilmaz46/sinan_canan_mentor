// MentorLogin.js - Mobile-first login interface for Mentor app
import { login } from '../../../shared/auth/auth.js';
import { logInfo, logError } from '../../../shared/utils/utils.js';

// Show mentor login form
export function showMentorLogin() {
    logInfo('Showing mentor login form');
    
    const container = document.getElementById('mentorContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="mentor-login">
            <div class="mentor-login-background"></div>
            <div class="mentor-login-card">
                <div class="mentor-login-header">
                    <div class="mentor-logo">
                        <img src="https://ik.imagekit.io/6iek12r3y/sinan-canan.jpeg" alt="Prof. Dr. Sinan Canan" class="mentor-avatar-login">
                    </div>
                    <h1>Sinan Hoca ile Konuş</h1>
                    <p>Nörobilim alanının saygın isimlerinden Prof. Dr. Sinan Canan ile kişisel mentörlük deneyimi</p>
                </div>
                
                <form id="mentorLoginForm" class="mentor-login-form">
                    <div class="mentor-form-group">
                        <label for="mentorUsername">Kullanıcı Adı</label>
                        <div class="mentor-input-wrapper">
                            <i class="fas fa-user"></i>
                            <input type="text" id="mentorUsername" name="username" required autocomplete="username" placeholder="Kullanıcı adınızı girin">
                        </div>
                    </div>
                    
                    <div class="mentor-form-group">
                        <label for="mentorPassword">Şifre</label>
                        <div class="mentor-input-wrapper">
                            <i class="fas fa-lock"></i>
                            <input type="password" id="mentorPassword" name="password" required autocomplete="current-password" placeholder="Şifrenizi girin">
                        </div>
                    </div>
                    
                    <button type="submit" class="mentor-login-button">
                        <span id="mentorLoginButtonText">
                            <i class="fas fa-comments"></i>
                            Konuşmaya başla
                        </span>
                        <i id="mentorLoginSpinner" class="fas fa-spinner fa-spin" style="display: none;"></i>
                    </button>
                    
                    <div id="mentorLoginError" class="mentor-error-message" style="display: none;"></div>
                </form>
                
                <div class="mentor-login-footer">
                    <div class="mentor-social-links">
                        <a href="https://www.acikbeyin.com" target="_blank" rel="noopener noreferrer">
                            <i class="fas fa-globe"></i>
                            Website
                        </a>
                        <a href="https://www.instagram.com/acikbeyinegitim/" target="_blank" rel="noopener noreferrer">
                            <i class="fab fa-instagram"></i>
                            Instagram
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup login form
    setupMentorLoginForm();
    
    // Focus on username field
    setTimeout(() => {
        document.getElementById('mentorUsername').focus();
    }, 300);
}

// Setup mentor login form functionality
function setupMentorLoginForm() {
    const loginForm = document.getElementById('mentorLoginForm');
    const usernameInput = document.getElementById('mentorUsername');
    const passwordInput = document.getElementById('mentorPassword');
    const loginButton = document.querySelector('.mentor-login-button');
    const loginButtonText = document.getElementById('mentorLoginButtonText');
    const loginSpinner = document.getElementById('mentorLoginSpinner');
    const loginError = document.getElementById('mentorLoginError');
    
    // Form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        
        if (!username || !password) {
            showMentorLoginError('Please enter your username and password.');
            return;
        }
        
        // Show loading state
        setMentorLoginLoading(true);
        hideMentorLoginError();
        
        try {
            const result = await login(username, password);
            
            if (result.success) {
                logInfo('Mentor login successful, navigating to conversation choice');
                // Navigate to conversation choice page instead of reloading
                window.location.hash = '/mentor/choice';
                window.location.reload();
            } else {
                throw new Error(result.error || 'Login failed');
            }
        } catch (error) {
            logError('Mentor login error:', error);
            showMentorLoginError(error.message || 'An error occurred while signing in.');
            setMentorLoginLoading(false);
        }
    });
    
    // Input event handlers
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            hideMentorLoginError();
            
            // Add focus animation
            input.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement.classList.remove('focused');
            }
        });
        
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('focused');
        });
    });
    
    // Enter key handling
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginForm.dispatchEvent(new Event('submit'));
            }
        });
    });
    
    function setMentorLoginLoading(loading) {
        loginButton.disabled = loading;
        loginButtonText.style.display = loading ? 'none' : 'flex';
        loginSpinner.style.display = loading ? 'inline' : 'none';
        
        if (loading) {
            loginButton.classList.add('loading');
        } else {
            loginButton.classList.remove('loading');
        }
    }
    
    function showMentorLoginError(message) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        
        // Add shake animation
        loginError.classList.add('shake');
        setTimeout(() => {
            loginError.classList.remove('shake');
        }, 500);
        
        // Vibrate on mobile devices
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
    }
    
    function hideMentorLoginError() {
        loginError.style.display = 'none';
        loginError.classList.remove('shake');
    }
} 