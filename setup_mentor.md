# Mentor App Setup Guide

## Overview
The Mentor app is now integrated into the Personas project using a Route-Based Multi-App Architecture. This allows both apps to coexist while sharing backend services and core functionality.

## Environment Configuration

Add the following environment variable to your `.env` file:

```env
# Sinan Canan Agent ID for Mentor App
SINAN_CANAN_AGENT_ID=your_sinan_canan_agent_id_here
```

## How to Access

### Personas App (Existing)
- URL: `http://localhost:3000/`
- Use existing credentials to login
- Full assessment and persona management features

### Mentor App (New)
- URL: `http://localhost:3000/mentor/`
- Use same credentials as Personas app
- Mobile-first design optimized for conversation with Sinan Canan

## Development Commands

```bash
# Run both apps in development mode
npm run dev:python

# Build both apps for production
npm run build:all

# Start production server
npm run start:python
```

## Testing the Mentor App

1. **Start the development server:**
   ```bash
   npm run dev:python
   ```

2. **Access the mentor app:**
   - Open browser to `http://localhost:3000/mentor/`
   - Login with existing credentials
   - Experience the mobile-first Sinan Canan interface

3. **Test conversation flow:**
   - Click "Konuşmaya Başla" button
   - Allow microphone permissions
   - Verify connection status updates
   - Test avatar animations and speaking indicators
   - End conversation and verify balance updates

## Key Features Implemented

### ✅ Phase 1: Infrastructure
- Route-based app separation (`/` vs `/mentor/`)
- Shared authentication and conversation logic
- Dynamic CSS loading based on app type

### ✅ Phase 2: Mobile-First UI
- Responsive design optimized for mobile devices
- Sinan Canan branding and color scheme (#5b0a0a)
- Clean, celebrity-focused interface

### ✅ Phase 3: Avatar System
- Large, prominent Sinan Canan avatar
- Connection state animations (connecting, connected, speaking)
- Speaking indicator with animated waves
- Status feedback system

### ✅ Phase 4: Backend Integration
- Sinan Canan persona added to presets
- Mentor-specific API endpoints
- Agent ID management for Sinan Canan
- Demo balance tracking (100 minutes)

## Architecture Benefits

1. **Easy Extraction:** The mentor app can be moved to a separate repository by copying `/src/apps/mentor/` and related files.

2. **Shared Infrastructure:** Both apps use the same authentication, conversation handling, and backend services.

3. **Independent Development:** Each app can evolve its UI/UX independently without affecting the other.

4. **Professional Demo:** Can demonstrate both the existing Personas capability and the new mentor concept.

## File Structure

```
src/
├── router.js                    # App routing logic
├── shared/                      # Shared utilities
│   ├── auth/                   # Authentication
│   ├── conversation/           # Voice conversation
│   └── utils/                  # Common utilities
├── apps/
│   ├── personas/              # Existing Personas app
│   │   ├── PersonasApp.js     # Main entry point
│   │   └── components/        # Personas components
│   └── mentor/                # New Mentor app
│       ├── MentorApp.js       # Main entry point
│       ├── components/        # Mentor components
│       ├── pages/             # Mentor pages
│       └── styles/            # Mentor styling
└── css/                       # Original Personas styles
```

## Deployment to Render.com

The same deployment configuration works for both apps:

**Build Command:**
```bash
pip install -r requirements.txt && npm install && npm run build:clean
```

**Start Command:**
```bash
uvicorn backend.server:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
- All existing Personas variables
- `SINAN_CANAN_AGENT_ID` (new)

## Demo Flow for Prof. Sinan Canan

1. **Show Existing Capability:**
   - Navigate to `http://localhost:3000/`
   - Demonstrate the professional Personas platform
   - Show role-play simulations and assessment features

2. **Reveal Mentor Experience:**
   - Navigate to `http://localhost:3000/mentor/`
   - Show the dedicated, celebrity-focused interface
   - Demonstrate the mobile-optimized conversation experience
   - Highlight the personal branding and social media integration

3. **Emphasize Technical Sophistication:**
   - Explain the shared backend infrastructure
   - Show how the same conversation technology powers both experiences
   - Demonstrate the easy extraction capability for future independence

This demonstrates both your technical capability and understanding that his audience deserves a purpose-built experience. 