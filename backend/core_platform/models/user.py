"""User database model."""
from sqlalchemy import Column, String, DateTime, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from db.session import Base


class User(Base):
    """User model for authentication and profile."""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    avatar_url = Column(String)
    
    status = Column(
        String(30),
        nullable=False,
        default="active",
        server_default="active"
    )
    
    email_verified_at = Column(DateTime(timezone=True))
    last_login_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.email}>"
