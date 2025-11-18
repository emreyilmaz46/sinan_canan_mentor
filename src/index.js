// index.js - Main application entry point with router integration
import { initializeApp } from './router.js';

// Import all CSS files statically
import './css/main.css';
import './css/variables.css';
import './css/base.css';
import './css/animations.css';
import './css/controls.css';
import './css/conversation.css';
import './css/sidebar.css';
import './css/login.css';
import './css/assessment.css';

// Import mentor styles
import './apps/mentor/styles/mentor.css';

// Initialize the appropriate app
document.addEventListener('DOMContentLoaded', initializeApp); 