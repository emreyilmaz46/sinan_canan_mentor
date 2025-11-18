# Enocta Personas: A Role-Play Simulation Platform

This project provides a sophisticated web-based voice conversation interface with AI personas for professional simulation purposes. It features multiple scenarios, and personas, real-time voice conversation, and a professional UI.

## Features

- **Multiple AI Personas**: Support for different AI personalities with customizable scenarios
- **Professional UI**: Clean, modern interface with clear status indicators
- **Session Management**: Tracks conversation duration and connection status
- **Responsive Design**: Works on both desktop and mobile devices
- **User Authentication**: JWT-based login system for access control

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- Python (v3.8 or higher)
- ElevenLabs API key
- ElevenLabs agent IDs for each persona

### Environment Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   ```

2. Create the `.env` file with your credentials:
   ```
   # ElevenLabs API Configuration
   XI_API_KEY=your_elevenlabs_api_key
   AGENT_ID=your_agent_id
   
   # JWT Authentication Configuration
   JWT_SECRET_KEY=your-secret-key-change-this-in-production
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install  # Install JavaScript dependencies
   pip install -r requirements.txt  # Install Python dependencies
   ```

## User Management

The application includes a user authentication system.

### Managing Users

Use the provided utility script to manage users:

```bash
# List all users
python -m backend.manage_users list

# Add a new user
python -m backend.manage_users add <username> <password> "<Full Name>" "<Organization>"

# Change a user's password
python -m backend.manage_users password <username> <new_password>
```

## Running the Application

The application can be run in different modes:

### Production Mode

This builds the frontend and serves it via FastAPI:

```bash
npm run start:python
```

### Development Mode

For development with hot reloading:

```bash
npm run dev:python
```

### Clean Build

To ensure a fresh build:

```bash
npm run build:clean
```

Access the application at http://localhost:3000/ once running.

## Project Structure

- `/backend`: Server code
  - `server.py`: Python/FastAPI backend
  - `datamodels.py`: Pydantic models for data validation
  - `presets.py`: Predefined personas and scenarios
  - `auth_utils.py`: Authentication utilities
  - `user_manager.py`: User management functions
  - `users.json`: User storage
- `/src`: Frontend code
  - `index.html`: Main HTML template
  - `/js`: JavaScript modules
    - `main.js`: Application entry point
    - `auth.js`: Authentication management
    - `login.js`: Login interface
    - `personas.js`: Persona management
    - `conversation.js`: Voice conversation handling
  - `/css`: Stylesheets
- `/dist`: Build output (created by webpack)

## Deployment

### Deploying to Render.com

1. Connect your GitHub repository to Render
2. Create a new Web Service with these settings:
   - **Build Command**: `pip install -r requirements.txt && npm install && npm run build:clean`
   - **Start Command**: `uvicorn backend.server:app --host 0.0.0.0 --port $PORT`

3. Set up environment variables in Render's dashboard:
   - All the variables from your `.env` file
   - Ensure `JWT_SECRET_KEY` is set to a secure random value

## Using the Application

1. Login with your credentials
2. Select a persona from the sidebar
3. Click "Start Conversation" to initiate the voice interaction
4. Allow microphone access when prompted
5. Speak to the AI agent and listen to their responses
6. Monitor the audio visualizer to see when the AI is speaking
7. End the conversation by clicking "End Conversation"
8. View the assessment results after the conversation

## Customizing

To add new personas, edit the `backend/presets.py` file with new `SimulationPersona` objects. 