# Supabase Database Management Scripts

This directory contains utility scripts for managing your Supabase database for the Thick Bi application. These scripts help with tasks like seeding data, cleaning up old records, and simulating activity.

## Prerequisites

All scripts require the following environment variables to be set:

- `SUPABASE_PROJECT_REF` - Your Supabase project reference
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

You can set these variables in a `.env` file in the project root directory.

## Available Scripts

### 1. Seed Guest Users

**File:** `seed-guest-users.js`

Creates fake guest profiles in the `profiles` table with random usernames and `is_guest: true`.

**Usage:**
```bash
# Seed 100 guest users (default)
node scripts/seed-guest-users.js

# Seed a specific number of guest users
node scripts/seed-guest-users.js 200
```

**Benefits:**
- Test real-time joining with multiple users
- Build audience population logic
- Test default avatars and usernames

### 2. Insert Sample Messages

**File:** `insert-sample-messages.js`

Inserts 5 fake messages into each active room in your Supabase database.

**Usage:**
```bash
node scripts/insert-sample-messages.js
```

**Benefits:**
- Populate rooms with realistic conversation data
- Test message rendering and UI components
- Create a more engaging demo environment

### 3. Clean Up Old Messages

**File:** `cleanup-old-messages.js`

Deletes messages older than a specified number of days.

**Usage:**
```bash
# Delete messages older than 30 days (default)
node scripts/cleanup-old-messages.js

# Delete messages older than 7 days
node scripts/cleanup-old-messages.js 7

# Force deletion without confirmation
node scripts/cleanup-old-messages.js --force
```

**Benefits:**
- Simulate moderation activities
- Reset application state
- Manage database size and performance

### 4. Clean Up Empty Rooms

**File:** `cleanup-empty-rooms.js`

Identifies and deletes rooms with no active participants, optionally removing related messages.

**Usage:**
```bash
# Delete empty rooms and their messages
node scripts/cleanup-empty-rooms.js

# Delete only rooms older than 7 days
node scripts/cleanup-empty-rooms.js --older-than 7

# Only show what would be deleted without actually deleting
node scripts/cleanup-empty-rooms.js --dry-run

# Don't delete related messages
node scripts/cleanup-empty-rooms.js --no-messages
```

**Benefits:**
- Keep the room feed clean and relevant
- Test auto-archiving logic
- Remove abandoned or test rooms

### 5. Simulate Real-Time Room Activity

**File:** `simulate-room-activity.js`

Continuously inserts messages into random active rooms at specified intervals.

**Usage:**
```bash
# Insert a message every 10 seconds (default)
node scripts/simulate-room-activity.js

# Insert a message every 5 seconds
node scripts/simulate-room-activity.js --interval 5

# Run for a specific duration (in seconds)
node scripts/simulate-room-activity.js --duration 300
```

**Benefits:**
- Stress-test the Vibe UI and audio sync
- Test real-time subscription functionality
- Simulate active user engagement

## Automation Ideas

These scripts can be incorporated into your development workflow:

1. **Development Reset:**
   ```bash
   node scripts/cleanup-old-messages.js 1 --force && node scripts/seed-guest-users.js 50
   ```

2. **Demo Environment Setup:**
   ```bash
   node scripts/seed-guest-users.js 100 && node scripts/insert-sample-messages.js
   ```

3. **Scheduled Cleanup (via cron):**
   ```bash
   0 0 * * * cd /path/to/project && node scripts/cleanup-empty-rooms.js --older-than 14 --force
   ```

## Notes

- All scripts use the Supabase service role key, which has full access to your database. Be careful when running these scripts in production environments.
- The scripts include safety measures like confirmation prompts and dry-run options to prevent accidental data loss.
- These scripts work with the guest authentication system in your application, which creates guest profiles with `is_guest=true` and stores the guest profile ID in localStorage.
