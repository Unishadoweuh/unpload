#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker/docker-compose.prod.yml"
ENV_FILE=".env"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          UnPload Production Deployment Script                ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: $ENV_FILE file not found!${NC}"
    echo -e "${YELLOW}Please create a .env file with the following variables:${NC}"
    echo "  DB_USER=unpload"
    echo "  DB_PASSWORD=your_secure_password"
    echo "  DB_NAME=unpload"
    echo "  JWT_SECRET=your_secure_jwt_secret"
    echo "  JWT_EXPIRES_IN=7d"
    echo "  CORS_ORIGIN=https://your-domain.com"
    exit 1
fi

echo -e "${GREEN}✓ Found $ENV_FILE file${NC}"

# Function to wait for container to be healthy
wait_for_healthy() {
    local container_name=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    echo -e "${YELLOW}⏳ Waiting for $container_name to be healthy...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "not_found")
        
        if [ "$health" = "healthy" ]; then
            echo -e "${GREEN}✓ $container_name is healthy${NC}"
            return 0
        elif [ "$health" = "not_found" ]; then
            echo -e "${RED}❌ Container $container_name not found${NC}"
            return 1
        fi
        
        echo -e "  Attempt $attempt/$max_attempts - Status: $health"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ $container_name failed to become healthy after $max_attempts attempts${NC}"
    return 1
}

# Parse command line arguments
FRESH_INSTALL=false
REBUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --fresh)
            FRESH_INSTALL=true
            shift
            ;;
        --rebuild)
            REBUILD=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --fresh     Fresh install (removes all data and rebuilds)"
            echo "  --rebuild   Force rebuild of Docker images"
            echo "  --help      Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Fresh install - remove all volumes
if [ "$FRESH_INSTALL" = true ]; then
    echo -e "${YELLOW}⚠️  Fresh install requested - this will DELETE ALL DATA!${NC}"
    read -p "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Aborted."
        exit 0
    fi
    
    echo -e "${YELLOW}🗑️  Stopping and removing containers and volumes...${NC}"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down -v 2>/dev/null || true
fi

# Rebuild images if requested
if [ "$REBUILD" = true ] || [ "$FRESH_INSTALL" = true ]; then
    echo -e "${BLUE}🔨 Building Docker images (this may take a few minutes)...${NC}"
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build --no-cache
fi

# Step 1: Start database first
echo ""
echo -e "${BLUE}📦 Step 1/4: Starting database...${NC}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d db

# Wait for database to be healthy
wait_for_healthy "unpload-db" 30

# Step 2: Run database migrations
echo ""
echo -e "${BLUE}📦 Step 2/4: Running database migrations...${NC}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm api npx prisma db push --accept-data-loss

# Step 3: Start all services
echo ""
echo -e "${BLUE}📦 Step 3/4: Starting all services...${NC}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

# Step 4: Wait for services to be healthy
echo ""
echo -e "${BLUE}📦 Step 4/4: Waiting for services to be ready...${NC}"

wait_for_healthy "unpload-api" 60
wait_for_healthy "unpload-web" 60

# Final status
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                  🎉 Deployment Complete! 🎉                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Services Status:${NC}"
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
echo ""
echo -e "${YELLOW}📝 Notes:${NC}"
echo -e "  • The first user to register will become admin automatically"
echo -e "  • Access the app at: http://localhost:8080 (or your configured domain)"
echo -e "  • View logs with: docker compose -f $COMPOSE_FILE logs -f"
echo ""
