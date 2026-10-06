#!/usr/bin/env bash
# ==============================================================================
# Family Jeopardy - Raspberry Pi Update & Auto-Deployment Script
# ==============================================================================
# This script pulls the latest changes from Git, rebuilds the Docker container,
# cleans up stale Docker images to save SD card space, and verifies health.
# ==============================================================================

set -euo pipefail

# Text formatting
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}=====================================================${NC}"
echo -e "${CYAN}   Family Jeopardy - Automated Update Script        ${NC}"
echo -e "${CYAN}=====================================================${NC}"

# Navigate to the script's directory (workspace root)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Pull latest code from git if inside a git repository
if [ -d ".git" ]; then
    echo -e "\n${YELLOW}[1/4] Pulling latest code from Git...${NC}"
    git fetch origin
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    git reset --hard "origin/$CURRENT_BRANCH"
    echo -e "${GREEN}✓ Successfully updated to latest commit on $CURRENT_BRANCH.${NC}"
else
    echo -e "\n${YELLOW}[1/4] Not a git clone; skipping git pull...${NC}"
fi

# 2. Check for docker compose binary
echo -e "\n${YELLOW}[2/4] Detecting Docker Compose...${NC}"
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' was found.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Using: $COMPOSE_CMD${NC}"

# 3. Rebuild and launch the container
echo -e "\n${YELLOW}[3/4] Building and launching Family Jeopardy container...${NC}"
$COMPOSE_CMD down || true
$COMPOSE_CMD up -d --build --remove-orphans

# Clean up dangling build images to save Raspberry Pi SD card storage
echo -e "${YELLOW}Cleaning up dangling Docker images...${NC}"
docker image prune -f >/dev/null 2>&1 || true

# 4. Verification and Health Check
echo -e "\n${YELLOW}[4/4] Verifying server health on port 3000...${NC}"
sleep 3

MAX_RETRIES=10
RETRY_COUNT=0
HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -f -o /dev/null "http://localhost:3000"; then
        HEALTHY=true
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo -e "Waiting for server to start (attempt $RETRY_COUNT/$MAX_RETRIES)..."
    sleep 2
done

if [ "$HEALTHY" = true ]; then
    LOCAL_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")
    echo -e "\n${GREEN}=====================================================${NC}"
    echo -e "${GREEN}   Family Jeopardy is UP and RUNNING!                ${NC}"
    echo -e "${GREEN}=====================================================${NC}"
    echo -e "Access the game from any device on your Wi-Fi:"
    echo -e "  - Living Room TV:     ${CYAN}http://${LOCAL_IP}:3000?role=tv${NC}"
    echo -e "  - Host Controller:    ${CYAN}http://${LOCAL_IP}:3000?role=host${NC}"
    echo -e "  - Main Board:         ${CYAN}http://${LOCAL_IP}:3000${NC}"
    echo -e "${GREEN}=====================================================${NC}"
else
    echo -e "\n${RED}Warning: Server did not respond on http://localhost:3000 within 20s.${NC}"
    echo -e "Run 'docker logs family-jeopardy' to inspect server logs."
    exit 1
fi
