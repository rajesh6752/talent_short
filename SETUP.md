# AI Hiring Platform - Development Setup

Complete authentication system with Docker Compose setup.

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup.sh
```

This will:
- Start PostgreSQL and Redis in Docker
- Create Python virtual environment
- Install dependencies
- Run database migrations

### Option 2: Manual Setup

```bash
# 1. Start database services
docker-compose up -d postgres redis

# 2. Create Python virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
cp .env.example .env
# Edit .env with your configuration

# 5. Run database migrations
alembic upgrade head

# 6. Start the backend
uvicorn app.main:app --reload
```

### Option 3: Full Docker Compose

```bash
# Build and start all services (PostgreSQL, Redis, Backend)
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## Running the Application

### Local Development (without Docker for backend)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### With Docker Compose
```bash
docker-compose up
```

## Accessing the Application

- **API Documentation (Swagger)**: http://localhost:8000/docs
- **API Documentation (ReDoc)**: http://localhost:8000/redoc
- **API Health Check**: http://localhost:8000/health
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/me` - Update user profile
- `POST /api/v1/auth/logout` - Logout

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# View migration history
alembic history
```

## Testing the API

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Get profile (with token):**
```bash
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Project Structure

```
talent_short/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   └── auth.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── dependencies.py
│   │   ├── db/
│   │   │   └── session.py
│   │   ├── models/
│   │   │   └── user.py
│   │   ├── schemas/
│   │   │   └── auth.py
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── docker-compose.yml
└── setup.sh
```

## Environment Variables

Key environment variables in `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hiring_platform

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Redis
REDIS_URL=redis://localhost:6379/0
```

## Troubleshooting

### Port already in use
```bash
# Check what's using port 8000
lsof -i :8000

# Stop Docker containers
docker-compose down
```

### Database connection issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Migration issues
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v
docker-compose up -d postgres
alembic upgrade head
```

## Next Steps

1. ✅ Authentication APIs are complete
2. 🔄 Add Tenant Management APIs
3. 🔄 Add Job Management APIs
4. 🔄 Add Resume & Candidate APIs
5. 🔄 Add AI Matching APIs

See the main [readme.md](./readme.md) for complete feature list.
