#!/bin/bash

# docker_e2e_runner.sh
# Usage: ./docker_e2e_runner.sh <compose_file> <target_url> <actions_json> <output_dir>

COMPOSE_FILE=$1
TARGET_URL=$2
ACTIONS_JSON=$3
OUTPUT_DIR=$4

if [ -z "$COMPOSE_FILE" ] || [ -z "$TARGET_URL" ] || [ -z "$OUTPUT_DIR" ]; then
    echo "Usage: $0 <compose_file> <target_url> <actions_json> <output_dir>"
    exit 1
fi

echo "🐳 Starting Docker environment: $COMPOSE_FILE"
docker compose -f "$COMPOSE_FILE" up -d --build

# Simple wait for health
echo "⏳ Waiting for services to be ready..."
MAX_RETRIES=30
COUNT=0
until $(curl --output /dev/null --silent --head --fail "$TARGET_URL"); do
    if [ $COUNT -eq $MAX_RETRIES ]; then
      echo "❌ Timeout waiting for $TARGET_URL"
      docker compose -f "$COMPOSE_FILE" logs
      docker compose -f "$COMPOSE_FILE" down
      exit 1
    fi
    printf '.'
    sleep 2
    COUNT=$((COUNT+1))
done

echo -e "\n🚀 Services are UP. Running Puppeteer E2E..."

# Run the existing capture script
# Note: We use node from the host environment
node "$(dirname "$0")/capture_evidence.js" "$TARGET_URL" "$ACTIONS_JSON" "$OUTPUT_DIR"
EXIT_CODE=$?

echo "🛑 Shutting down Docker environment..."
docker compose -f "$COMPOSE_FILE" down

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Docker E2E Flow Finished Successfully."
else
    echo "❌ Docker E2E Flow Failed."
fi

exit $EXIT_CODE
