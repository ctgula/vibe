#!/usr/bin/env node

/**
 * Script to fix TypeScript errors in the Room component
 */

const fs = require('fs');
const path = require('path');

// Path to the Room component file
const roomFilePath = path.join(__dirname, '..', 'app', 'room', '[id]', 'page.tsx');

// Read the file
console.log('📄 Reading Room component file...');
let content = fs.readFileSync(roomFilePath, 'utf8');

// Fix 1: Replace user?.name with profile?.display_name || profile?.username
console.log('🔄 Fixing user.name reference...');
content = content.replace(
  /profiles: \{ name: user\?\.name \|\| 'Guest' \}/g,
  "profiles: { name: profile?.display_name || profile?.username || 'Guest' }"
);

// Fix 2: Replace user?.id || guestId with id in Stage component
console.log('🔄 Fixing currentUserId in Stage component...');
content = content.replace(
  /currentUserId=\{user\?\.id \|\| guestId\}/g,
  "currentUserId={id}"
);

// Fix 3: Replace user?.id || guestId with id in Audience component
console.log('🔄 Fixing currentUserId in Audience component...');
content = content.replace(
  /currentUserId=\{user\?\.id \|\| guestId\}/g,
  "currentUserId={id}"
);

// Write the updated content back to the file
fs.writeFileSync(roomFilePath, content, 'utf8');

console.log('✅ TypeScript fixes applied successfully!');
console.log('');
console.log('The fixes:');
console.log('1. Replaced user?.name with profile?.display_name || profile?.username || \'Guest\'');
console.log('2. Replaced user?.id || guestId with the type-safe id variable in multiple places');
console.log('');
console.log('These changes ensure type safety throughout the component.');
