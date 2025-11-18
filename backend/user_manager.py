"""User management functions for JSON file storage"""
import json
import os
from typing import Optional, List, Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Path to users JSON file
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

def load_users() -> List[Dict]:
    """Load users from JSON file"""
    try:
        with open(USERS_FILE, 'r') as f:
            data = json.load(f)
            return data.get("users", [])
    except FileNotFoundError:
        logger.error(f"Users file not found: {USERS_FILE}")
        return []
    except json.JSONDecodeError:
        logger.error(f"Invalid JSON in users file: {USERS_FILE}")
        return []

def save_users(users: List[Dict]) -> bool:
    """Save users to JSON file"""
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump({"users": users}, f, indent=4)
        return True
    except Exception as e:
        logger.error(f"Error saving users: {e}")
        return False

def find_user_by_username(username: str) -> Optional[Dict]:
    """Find a user by username"""
    users = load_users()
    for user in users:
        if user.get("username") == username:
            return user
    return None

def update_last_login(username: str) -> bool:
    """Update the last login timestamp for a user"""
    users = load_users()
    for user in users:
        if user.get("username") == username:
            user["last_login"] = datetime.utcnow().isoformat() + "Z"
            return save_users(users)
    return False

def add_user(user_data: Dict) -> bool:
    """Add a new user to the system"""
    users = load_users()
    
    # Check if username already exists
    if any(u.get("username") == user_data.get("username") for u in users):
        logger.error(f"Username already exists: {user_data.get('username')}")
        return False
    
    # Add creation timestamp
    user_data["created_at"] = datetime.utcnow().isoformat() + "Z"
    user_data["last_login"] = None
    
    users.append(user_data)
    return save_users(users)

def get_user_info(username: str) -> Optional[Dict]:
    """Get user info without password hash"""
    user = find_user_by_username(username)
    if user:
        # Return user info without password hash
        return {
            "id": user.get("id"),
            "username": user.get("username"),
            "name": user.get("name"),
            "organization": user.get("organization"),
            "created_at": user.get("created_at"),
            "last_login": user.get("last_login")
        }
    return None 