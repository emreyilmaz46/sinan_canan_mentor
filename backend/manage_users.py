#!/usr/bin/env python3
"""
User management utility for Enocta Personas

Usage:
    python manage_users.py list                      - List all users
    python manage_users.py add <username> <password> <name> <organization>  - Add a new user
    python manage_users.py password <username> <new_password>               - Change password
"""

import sys
import uuid
from datetime import datetime
from backend.auth_utils import hash_password
from backend.user_manager import load_users, save_users, find_user_by_username, add_user

def list_users():
    """List all users in the system"""
    users = load_users()
    
    if not users:
        print("No users found.")
        return
    
    print(f"\nTotal users: {len(users)}")
    print("-" * 80)
    print(f"{'Username':<15} {'Name':<25} {'Organization':<20} {'Last Login':<20}")
    print("-" * 80)
    
    for user in users:
        last_login = user.get('last_login', 'Never')
        if last_login and last_login != 'Never':
            try:
                dt = datetime.fromisoformat(last_login.replace('Z', '+00:00'))
                last_login = dt.strftime('%Y-%m-%d %H:%M')
            except:
                pass
        
        print(f"{user['username']:<15} {user['name']:<25} {user['organization']:<20} {last_login:<20}")

def add_new_user(username, password, name, organization):
    """Add a new user to the system"""
    # Check if user already exists
    if find_user_by_username(username):
        print(f"Error: User '{username}' already exists.")
        return False
    
    # Create user data
    user_data = {
        "id": f"user_{uuid.uuid4().hex[:8]}",
        "username": username,
        "password_hash": hash_password(password),
        "name": name,
        "organization": organization
    }
    
    # Add user
    if add_user(user_data):
        print(f"✓ User '{username}' added successfully.")
        return True
    else:
        print(f"✗ Failed to add user '{username}'.")
        return False

def change_password(username, new_password):
    """Change a user's password"""
    users = load_users()
    
    for user in users:
        if user.get("username") == username:
            user["password_hash"] = hash_password(new_password)
            if save_users(users):
                print(f"✓ Password updated for user '{username}'.")
                return True
            else:
                print(f"✗ Failed to update password.")
                return False
    
    print(f"Error: User '{username}' not found.")
    return False

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "list":
        list_users()
    
    elif command == "add":
        if len(sys.argv) != 6:
            print("Usage: python manage_users.py add <username> <password> <name> <organization>")
            sys.exit(1)
        
        username = sys.argv[2]
        password = sys.argv[3]
        name = sys.argv[4]
        organization = sys.argv[5]
        
        add_new_user(username, password, name, organization)
    
    elif command == "password":
        if len(sys.argv) != 4:
            print("Usage: python manage_users.py password <username> <new_password>")
            sys.exit(1)
        
        username = sys.argv[2]
        new_password = sys.argv[3]
        
        change_password(username, new_password)
    
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)

if __name__ == "__main__":
    main() 