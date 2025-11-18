#!/usr/bin/env python3
"""
JWT Secret Key Generator for Enocta Personas

This script generates a cryptographically secure random key suitable for JWT token signing.
Run this script and copy the generated key to your .env file.
"""

import secrets
import string

def generate_jwt_secret():
    """Generate a cryptographically secure JWT secret key"""
    
    print("🔐 JWT Secret Key Generator")
    print("=" * 50)
    
    # Method 1: URL-safe base64 encoded (recommended)
    secret_base64 = secrets.token_urlsafe(64)  # 64 bytes = 512 bits
    
    # Method 2: Hexadecimal (alternative)
    secret_hex = secrets.token_hex(32)  # 32 bytes = 256 bits
    
    # Method 3: Alphanumeric + symbols (more readable)
    alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
    secret_readable = ''.join(secrets.choice(alphabet) for _ in range(64))
    
    print("Option 1 (Recommended - URL-safe base64):")
    print(f"JWT_SECRET_KEY={secret_base64}")
    print()
    
    print("Option 2 (Hexadecimal):")
    print(f"JWT_SECRET_KEY={secret_hex}")
    print()
    
    print("Option 3 (Alphanumeric + symbols):")
    print(f"JWT_SECRET_KEY={secret_readable}")
    print()
    
    print("💡 Instructions:")
    print("1. Copy one of the lines above")
    print("2. Replace the JWT_SECRET_KEY line in your .env file")
    print("3. Make sure to keep your .env file secure and never commit it to version control")
    print()
    
    print("✅ All options provide sufficient security for production use.")
    print("   We recommend Option 1 for maximum compatibility.")

if __name__ == "__main__":
    generate_jwt_secret() 