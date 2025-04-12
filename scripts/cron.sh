#!/bin/bash
# Cron job script for Thick Bi application maintenance
# This script can be run manually or scheduled via crontab

# Load environment variables
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi

# Set the project directory
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

# Log file for cron output
LOG_FILE="$PROJECT_DIR/logs/cron-$(date +%Y-%m-%d).log"
mkdir -p "$PROJECT_DIR/logs"

# Function to log messages
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to run a script
run_script() {
  SCRIPT=$1
  DESCRIPTION=$2
  
  log "Running $DESCRIPTION..."
  node "$PROJECT_DIR/scripts/$SCRIPT" >> "$LOG_FILE" 2>&1
  
  if [ $? -eq 0 ]; then
    log "✅ $DESCRIPTION completed successfully"
  else
    log "❌ $DESCRIPTION failed"
  fi
}

# Check which task to run based on the argument
TASK=${1:-"all"}

case "$TASK" in
  "cleanup-daily")
    # Daily cleanup tasks
    log "Starting daily cleanup tasks..."
    run_script "cleanup-empty-rooms.js --older-than 7 --force" "Empty room cleanup"
    run_script "cleanup-old-messages.js 30 --force" "Old message cleanup"
    ;;
    
  "analytics-hourly")
    # Hourly analytics update
    log "Starting hourly analytics update..."
    run_script "update-room-analytics.js" "Room analytics update"
    ;;
    
  "seed-messages")
    # Seed messages every 15 minutes (for active rooms)
    log "Seeding messages for active rooms..."
    run_script "insert-sample-messages.js" "Sample message insertion"
    ;;
    
  "demo-refresh")
    # Weekly demo mode refresh
    log "Refreshing demo mode..."
    run_script "seed-demo-mode.js" "Demo mode setup"
    ;;
    
  "all")
    # Run all maintenance tasks
    log "Running all maintenance tasks..."
    run_script "cleanup-empty-rooms.js --older-than 7 --force" "Empty room cleanup"
    run_script "cleanup-old-messages.js 30 --force" "Old message cleanup"
    run_script "update-room-analytics.js" "Room analytics update"
    ;;
    
  *)
    log "Unknown task: $TASK"
    echo "Usage: $0 [cleanup-daily|analytics-hourly|seed-messages|demo-refresh|all]"
    exit 1
    ;;
esac

log "Maintenance completed"
