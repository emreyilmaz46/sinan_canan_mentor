# backend/server.py
from fastapi import FastAPI, HTTPException, Query, Response, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import logging
from dotenv import load_dotenv
from typing import List

# Import our new data models and presets
from backend.datamodels import SimulationPersona
from backend.presets import get_preset_personas

# Import authentication modules
from fastapi import Depends, status
from pydantic import BaseModel
from backend.auth_utils import verify_password, create_access_token
from backend.user_manager import find_user_by_username, update_last_login, get_user_info
from backend.auth_middleware import get_current_user

from backend.conversation_catchup_utils import get_conversation_from_elevenlabs, get_top_documents, select_phrase, analyze_conversation
from models import ConversationAnalysisResponse, SourceDocument

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for authentication
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Authentication endpoints
@app.post("/api/auth/login")
async def login(login_data: LoginRequest):
    """Login endpoint to authenticate users and return JWT token"""
    logger.info(f"Login attempt for username: {login_data.username}")
    
    # Find user by username
    user = find_user_by_username(login_data.username)
    if not user:
        logger.warning(f"Login failed - user not found: {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı veya şifre!"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.get("password_hash", "")):
        logger.warning(f"Login failed - invalid password for user: {login_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı veya şifre!"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user["username"]})
    
    # Update last login
    update_last_login(user["username"])
    
    # Get user info without password
    user_info = get_user_info(user["username"])
    
    logger.info(f"Login successful for user: {login_data.username}")
    
    return TokenResponse(
        access_token=access_token,
        user=user_info
    )

@app.post("/api/auth/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify JWT token and return user info"""
    logger.info(f"Token verified for user: {current_user.get('username')}")
    return {"valid": True, "user": current_user}

@app.post("/api/auth/logout")
async def logout():
    """Logout endpoint (mainly for client-side handling)"""
    logger.info("Logout request received")
    return {"message": "Logged out successfully"}

# API routes should be defined before static file handling
@app.get("/api/signed-url")
async def get_signed_url(agent_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    logger.info("Received request for signed URL")
    
    # Use provided agent_id if available, otherwise fall back to environment variable
    default_agent_id = os.getenv("AGENT_ID")
    selected_agent_id = agent_id if agent_id else default_agent_id
    
    xi_api_key = os.getenv("XI_API_KEY")
    
    logger.info(f"Using Agent ID: {selected_agent_id if selected_agent_id else 'Not set'}")
    logger.info(f"(Param agent_id: {agent_id}, Default: {default_agent_id})")
    
    if not xi_api_key:
        logger.info("API Key: Not set")
    else:
        logger.info(f"API Key: {xi_api_key[:5]}...{xi_api_key[-5:] if len(xi_api_key) > 10 else ''}")
    
    if not selected_agent_id or not xi_api_key:
        logger.error("Missing required parameters")
        raise HTTPException(status_code=500, detail="Missing agent ID or API key")
    
    url = f"https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id={selected_agent_id}"
    logger.info(f"Making request to: {url}")
    
    async with httpx.AsyncClient() as client:
        try:
            logger.info("Sending request to ElevenLabs API")
            response = await client.get(
                url,
                headers={"xi-api-key": xi_api_key}
            )
            logger.info(f"Received response with status: {response.status_code}")
            
            response.raise_for_status()
            data = response.json()
            logger.info("Successfully parsed response JSON")
            
            # Log a portion of the signed URL for debugging
            signed_url = data["signed_url"]
            logger.info(f"Signed URL (first 30 chars): {signed_url[:30]}...")
            
            return {"signedUrl": signed_url}
            
        except httpx.HTTPError as e:
            logger.error(f"HTTP error: {str(e)}")
            if hasattr(e, 'response') and e.response is not None:
                logger.error(f"Response content: {e.response.text}")
            raise HTTPException(status_code=500, detail=f"Failed to get signed URL: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")


# API route for getting all available personas with their agent IDs
@app.get("/api/personas")
def get_personas(current_user: dict = Depends(get_current_user)):
    logger.info("Received request for available personas")
    
    try:
        # Get personas from presets
        personas_list = get_preset_personas()
        logger.info(f"Retrieved {len(personas_list)} personas from presets")
        
        # Convert Pydantic models to dictionaries
        personas_dict = [persona.dict() for persona in personas_list]
        
        return {"personas": personas_dict}
    except Exception as e:
        logger.error(f"Error retrieving personas: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve personas: {str(e)}")


#API route for getting Agent ID, used for public agents
@app.get("/api/getAgentId")
def get_unsigned_url():
    logger.info("Received request for Agent ID")
    agent_id = os.getenv("AGENT_ID")
    logger.info(f"Returning Agent ID: {agent_id}")
    return {"agentId": agent_id}

# API route for getting Sinan Canan agent ID (mentor app)
@app.get("/api/mentor/agent-id")
def get_mentor_agent_id(current_user: dict = Depends(get_current_user)):
    logger.info("Received request for Sinan Canan Agent ID")
    agent_id = os.getenv("SINAN_CANAN_AGENT_ID")
    logger.info(f"Returning Sinan Canan Agent ID: {agent_id}")
    return {"agentId": agent_id}

# API route for mentor conversation history (placeholder for future implementation)
@app.get("/api/mentor/conversations/history")
def get_mentor_conversation_history(current_user: dict = Depends(get_current_user)):
    logger.info("Received request for mentor conversation history")
    # This will be implemented in Phase 4
    return {"conversations": [], "monthlyBalance": 6000}

# API route for mentor user balance
@app.get("/api/mentor/user/balance")
def get_mentor_user_balance(current_user: dict = Depends(get_current_user)):
    logger.info("Received request for mentor user balance")
    # Demo balance - this would be stored in database in real implementation
    return {"balance": 6000, "unit": "seconds"}

# Serve index.html for root path
@app.get("/")
async def serve_root():
    logger.info("Serving index.html")
    return FileResponse("dist/index.html")

# Serve mentor app for /mentor/* paths
@app.get("/mentor")
async def serve_mentor_root():
    logger.info("Serving mentor app root")
    return FileResponse("dist/index.html")

@app.get("/mentor/{path:path}")
async def serve_mentor_path(path: str):
    logger.info(f"Serving mentor app path: {path}")
    return FileResponse("dist/index.html")

@app.get("/conversation/{conversation_id}/catchup", response_model=ConversationAnalysisResponse)
async def get_conversation_catchup(conversation_id: str):
    """Get conversation analysis"""
    
    print(f"Processing conversation catchup for ID: {conversation_id}")
    
    # Get conversation from ElevenLabs
    conversation = await get_conversation_from_elevenlabs(conversation_id)
    print(f"Conversation: {conversation}")
    
    
    # Get top documents
    top_documents = get_top_documents(conversation)
    
    # Select phrase
    catch_phrase = select_phrase(conversation)
    
    # Analyze conversation
    conversation_catchup = analyze_conversation(conversation)
    
    # Prepare response
    source_documents = []
    for doc in top_documents:
        source_documents.append(SourceDocument(
            document_id=doc['document_id'],
            document_name=doc['document_name'],
            chunk_id=doc['chunk_id'],
            vector_distance=doc['vector_distance'],
            content_preview=doc['content_preview']
        ))
    
    return ConversationAnalysisResponse(
        catch_phrase=catch_phrase,
        top_sources=source_documents,
        conversation_catchup=conversation_catchup
    )
    

# Serve individual static files - specific routes first
@app.get("/bundle.js")
async def serve_bundle():
    logger.info("Serving bundle.js")
    return FileResponse("dist/bundle.js")

@app.get("/styles.css")
async def serve_styles():
    logger.info("Serving styles.css")
    return FileResponse("dist/styles.css")

# Serve all webpack-generated JS chunks
@app.get("/{filename}.bundle.js")
async def serve_js_chunks(filename: str):
    file_path = f"dist/{filename}.bundle.js"
    logger.info(f"Serving JS chunk: {file_path}")
    return FileResponse(file_path)

# Mount static directory for any other static assets
app.mount("/static", StaticFiles(directory="dist"), name="static")

# API route for getting conversations for an agent
@app.get("/api/agent-conversations")
async def get_agent_conversations(agent_id: str = Query(None), current_user: dict = Depends(get_current_user)):
    logger.info(f"Fetching conversations for agent: {agent_id}")
    
    # Use provided agent_id if available, otherwise fall back to environment variable
    default_agent_id = os.getenv("AGENT_ID")
    selected_agent_id = agent_id if agent_id else default_agent_id
    
    xi_api_key = os.getenv("XI_API_KEY")
    
    if not selected_agent_id or not xi_api_key:
        logger.error("Missing required parameters")
        raise HTTPException(status_code=500, detail="Missing agent ID or API key")
    
    url = f"https://api.elevenlabs.io/v1/convai/conversations?agent_id={selected_agent_id}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                url,
                headers={"xi-api-key": xi_api_key}
            )
            
            response.raise_for_status()
            data = response.json()
            logger.info(f"Retrieved {len(data.get('conversations', []))} conversations")
            
            return data
        except Exception as e:
            logger.error(f"Error fetching conversations: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")

# API route for getting conversation details by ID
@app.get("/api/conversation/{conversation_id}")
async def get_conversation(conversation_id: str, current_user: dict = Depends(get_current_user)):
    logger.info(f"Fetching conversation details for ID: {conversation_id}")
    
    xi_api_key = os.getenv("XI_API_KEY")
    
    if not xi_api_key:
        logger.error("Missing API key")
        raise HTTPException(status_code=500, detail="Missing API key")
    
    url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                url,
                headers={"xi-api-key": xi_api_key}
            )
            
            response.raise_for_status()
            data = response.json()
            logger.info(f"Retrieved conversation data for ID: {conversation_id}")
            
            return data
        except Exception as e:
            logger.error(f"Error fetching conversation: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch conversation: {str(e)}")

# API route for getting conversation audio by ID
@app.get("/api/conversation/{conversation_id}/audio")
async def get_conversation_audio(conversation_id: str, range: str = Header(None), current_user: dict = Depends(get_current_user)):
    logger.info(f"Fetching conversation audio for ID: {conversation_id}")
    if range:
        logger.info(f"Range header received: {range}")
    
    xi_api_key = os.getenv("XI_API_KEY")
    
    if not xi_api_key:
        logger.error("Missing API key")
        raise HTTPException(status_code=500, detail="Missing API key")
    
    url = f"https://api.elevenlabs.io/v1/convai/conversations/{conversation_id}/audio"
    
    async with httpx.AsyncClient() as client:
        try:
            headers = {"xi-api-key": xi_api_key}
            # Forward the range header if it was provided
            if range:
                headers["Range"] = range
                
            response = await client.get(
                url,
                headers=headers
            )
            
            response.raise_for_status()
            
            # Get content type from response
            content_type = response.headers.get("content-type", "audio/wav")
            
            # Get content length if available
            content_length = response.headers.get("content-length")
            
            # Prepare response headers
            response_headers = {}
            if content_length:
                response_headers["Content-Length"] = content_length
                
            # If it was a range request, return 206 Partial Content
            status_code = 200
            if range and response.status_code == 206:
                status_code = 206
                if "content-range" in response.headers:
                    response_headers["Content-Range"] = response.headers["content-range"]
            
            # Return audio binary data with appropriate headers
            return Response(
                content=response.content, 
                media_type=content_type,
                headers=response_headers,
                status_code=status_code
            )
        except Exception as e:
            logger.error(f"Error fetching conversation audio: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch conversation audio: {str(e)}") 

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)