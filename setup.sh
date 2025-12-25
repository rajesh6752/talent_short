#!/bin/bash

# Setup script for AI Hiring Platform backend

echo "🚀 Setting up AI Hiring Platform..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Create .env file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please update backend/.env with your configuration"
fi

# Start services
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if backend dependencies are installed
if [ ! -d "backend/venv" ]; then
    echo "📦 Creating Python virtual environment..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Run database migrations
echo "🗄️  Running database migrations..."
cd backend
source venv/bin/activate
alembic upgrade head
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Update backend/.env with your configuration"
echo "   2. Start the backend:"
echo "      cd backend"
echo "      source venv/bin/activate"
echo "      uvicorn app.main:app --reload"
echo ""
echo "   Or use Docker Compose for everything:"
echo "      docker-compose up"
echo ""
echo "📖 API Documentation will be available at:"
echo "   http://localhost:8000/docs"
echo ""
