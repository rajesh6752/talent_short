"""Pydantic schemas for authentication."""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


# Request Schemas
class UserRegister(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class TokenRefresh(BaseModel):
    """Schema for token refresh."""
    refresh_token: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    avatar_url: Optional[str] = None


# Response Schemas
class Token(BaseModel):
    """Schema for authentication tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class UserResponse(BaseModel):
    """Schema for user response."""
    id: UUID
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    phone: Optional[str]
    avatar_url: Optional[str]
    status: str
    email_verified_at: Optional[datetime]
    last_login_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    """Schema for authentication response."""
    user: UserResponse
    tokens: Token
