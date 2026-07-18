#!/bin/bash
# Start the BAM! FastAPI backend as a persistent mini-service
# This script runs the Python uvicorn server in the background and keeps it alive

BAM_API_DIR="/home/z/my-project/mini-services/bam-api"
LOG_FILE="$BAM_API_DIR/server.log"
PID_FILE="$BAM_API_DIR/server.pid"

# Kill existing process if running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Stopping existing BAM! API (PID: $OLD_PID)..."
        kill -9 "$OLD_PID" 2>/dev/null
        sleep 1
    fi
    rm -f "$PID_FILE"
fi

# Start the server
cd "$BAM_API_DIR"
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 > "$LOG_FILE" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$PID_FILE"

# Wait for startup
sleep 4

# Verify it's running
if kill -0 "$NEW_PID" 2>/dev/null; then
    echo "✅ BAM! API started (PID: $NEW_PID) on port 8001"
    echo "Log: $LOG_FILE"
else
    echo "❌ Failed to start BAM! API"
    echo "Last 20 log lines:"
    tail -20 "$LOG_FILE"
    exit 1
fi
