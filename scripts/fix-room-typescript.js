#!/usr/bin/env node

/**
 * Script to fix TypeScript error in the Room component
 * This script replaces the problematic line with a type-safe version
 */

const fs = require('fs');
const path = require('path');

// Path to the Room component file
const roomFilePath = path.join(__dirname, '..', 'app', 'room', '[id]', 'page.tsx');

// Read the file
console.log('📄 Reading Room component file...');
let content = fs.readFileSync(roomFilePath, 'utf8');

// Check if the fix is already applied
if (content.includes('const id = user?.id ?? guestId;')) {
  console.log('✅ Fix already applied!');
  process.exit(0);
}

// Replace the problematic line
console.log('🔄 Applying TypeScript fix...');

// Find the line with useParticipants hook
const problematicLine = "const { participants, userStatus, loading: participantsLoading } = useParticipants(params.id, user?.id || guestId);";
const fixedCode = `  // Get the user ID with proper type safety
  const id = user?.id ?? guestId;
  
  // If no user ID is available, return early
  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-900 p-4">
        <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full">
          <h2 className="text-xl font-semibold text-white mb-4">Authentication Required</h2>
          <p className="text-zinc-300 mb-6">You need to be signed in or have a guest session to join this room.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  // Use the participants hook with type-safe ID
  const { participants, userStatus, loading: participantsLoading } = useParticipants(params.id, id);`;

// Replace the problematic line with the fixed code
content = content.replace(problematicLine, fixedCode);

// Write the updated content back to the file
fs.writeFileSync(roomFilePath, content, 'utf8');

console.log('✅ TypeScript fix applied successfully!');
console.log('');
console.log('The fix:');
console.log('1. Added a type-safe ID assignment: const id = user?.id ?? guestId;');
console.log('2. Added an early return with a fallback UI if no valid ID is available');
console.log('3. Updated the hook call to use the validated ID: useParticipants(params.id, id)');
console.log('');
console.log('This ensures type safety while providing a good user experience when authentication is missing.');
