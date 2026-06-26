import os
from datetime import datetime, timedelta, timezone
import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# password hashing engine
# This uses bcrypt, the exact same algorithm used by major tech companies
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    """Checks if the typed password matches the scrambled hash in the DB"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Scrambles a plain text password into an unreadable hash"""
    return pwd_context.hash(password)

# jwt token generator
def create_access_token(data: dict):
    """Generates a secure, cryptographically signed token for the user"""
    to_encode = data.copy()
    
    # Set the expiration time
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Sign the token using our secret key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


