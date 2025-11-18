// personas.js - Persona management for Personas app
import { logInfo, logError } from '../../../shared/utils/utils.js';
import { getAuthHeaders } from '../../../shared/auth/auth.js';

// Shared state
let personas = []; // Array to store available personas

// Get currently selected persona
export function getSelectedPersona() {
    const activePersonaElement = document.querySelector('.persona.active');
    
    if (!activePersonaElement) {
        return null;
    }
    
    // Get the persona ID from the element's id attribute
    const personaId = activePersonaElement.id;
    
    // Find the full persona data from our loaded personas by id (not agent_id)
    const persona = personas.find(p => p.id === personaId) || {
        id: personaId || 'unknown',
        name: activePersonaElement.querySelector('.persona-info h4')?.textContent || 'Unknown',
        role: activePersonaElement.querySelector('.persona-info p')?.textContent || 'Unknown',
        agent_id: activePersonaElement.dataset.agentId,
        image: activePersonaElement.querySelector('.persona-avatar img')?.src || ''
    };
    
    return persona;
}

// Fetch available personas from the backend
export async function fetchPersonas() {
    try {
        logInfo('Fetching available personas from backend');
        const response = await fetch('/api/personas', {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch personas: ${response.status}`);
        }
        
        const data = await response.json();
        personas = data.personas || [];
        logInfo(`Loaded ${personas.length} personas from backend`, personas);
        
        // Update the UI with the available personas
        updatePersonaList(personas);
        
        return personas;
    } catch (error) {
        logError('Error fetching personas:', error);
        return [];
    }
}

// Update persona list in the UI
export function updatePersonaList(personasList) {
    const personaListElement = document.querySelector('.persona-list');
    
    if (!personaListElement || !personasList || personasList.length === 0) {
        return;
    }
    
    // Clear the list including the loading indicator
    personaListElement.innerHTML = '';
    
    // Create new persona elements
    personasList.forEach((persona, index) => {
        const personaElement = createPersonaElement(persona);
        
        // Make the first persona active by default
        if (index === 0) {
            personaElement.classList.add('active');
            updateActivePersonaDisplay(persona);
        }
        
        personaListElement.appendChild(personaElement);
    });
    
    // Re-attach event listeners
    handlePersonaSelection();
}

// Create a persona list item element
export function createPersonaElement(persona) {
    const personaElement = document.createElement('li');
    personaElement.className = 'persona';
    personaElement.id = persona.id;
    personaElement.dataset.agentId = persona.agent_id;
    
    personaElement.innerHTML = `
        <div class="persona-avatar">
            <img src="${persona.image}" alt="${persona.name}">
        </div>
        <div class="persona-info">
            <h4>${persona.name}</h4>
            <p>${persona.role}</p>
        </div>
    `;
    
    return personaElement;
}

// Update the active persona display area
export function updateActivePersonaDisplay(persona) {
    const activePersonaContainer = document.querySelector('.active-persona');
    if (!activePersonaContainer || !persona) {
        return;
    }
    
    // Update avatar - handle both image and icon cases
    const avatarContainer = activePersonaContainer.querySelector('.persona-avatar.large');
    if (avatarContainer) {
        // Check if we have an image or an icon
        const existingImg = avatarContainer.querySelector('img');
        const existingIcon = avatarContainer.querySelector('i');
        
        if (existingImg) {
            // Update existing image
            existingImg.src = persona.image;
            existingImg.alt = persona.name;
        } else if (existingIcon) {
            // Replace icon with new image
            avatarContainer.innerHTML = `<img src="${persona.image}" alt="${persona.name}">`;
        }
    }
    
    // Update name and role
    const nameElement = activePersonaContainer.querySelector('.persona-details h3');
    if (nameElement) {
        nameElement.textContent = persona.name;
    }
    
    const roleElement = activePersonaContainer.querySelector('.persona-details h4');
    if (roleElement) {
        roleElement.textContent = `${persona.role}`;
    }
    
    // Update description if available
    const descriptionElement = activePersonaContainer.querySelector('.persona-details p');
    if (descriptionElement && persona.description) {
        descriptionElement.textContent = persona.description;
    }
    
    // Update scenario and goal if available
    if (persona.scenario) {
        // Update scenario title
        const scenarioTitleElement = document.querySelector('.scenario-content h4');
        if (scenarioTitleElement && persona.scenario.title) {
            scenarioTitleElement.textContent = persona.scenario.title;
        }
        
        // Update scenario description
        const scenarioDescElement = document.querySelector('.scenario-content > p');
        if (scenarioDescElement && persona.scenario.description) {
            scenarioDescElement.textContent = persona.scenario.description;
        }
        
        // Update goal
        const goalElement = document.querySelector('.goal-box p');
        if (goalElement && persona.scenario.goal) {
            goalElement.textContent = persona.scenario.goal;
        }
    }
    
    logInfo('Updated display for persona:', persona.name);
}

export function handlePersonaSelection() {
    const personas = document.querySelectorAll('.persona');
    personas.forEach(persona => {
        persona.addEventListener('click', () => {
            // Don't allow changing persona during active conversation
            if (window.conversation) {
                alert('Please end the current conversation before changing personas.');
                return;
            }
            
            // Update active persona
            personas.forEach(p => p.classList.remove('active'));
            persona.classList.add('active');
            
            // Get the selected persona data
            const selectedPersona = getSelectedPersona();
            logInfo('Selected persona:', selectedPersona);
            
            // Update the active persona display
            updateActivePersonaDisplay(selectedPersona);
        });
    });
}

// Legacy export for compatibility
export function initPersonaSystem() {
    // This function is kept for compatibility but functionality is handled by other functions
    logInfo('Persona system initialized');
} 