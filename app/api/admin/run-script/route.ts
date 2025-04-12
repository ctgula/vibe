import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Map of script names to their file paths and parameters
type ScriptConfig = {
  path: string;
  params: string[];
  description: string;
  isCommand?: boolean;
};

const SCRIPTS: Record<string, ScriptConfig> = {
  'cleanup-old-messages': {
    path: 'scripts/cleanup-old-messages.js',
    params: ['--force'],
    description: 'Cleans up messages older than 30 days'
  },
  'cleanup-empty-rooms': {
    path: 'scripts/cleanup-empty-rooms.js',
    params: ['--force'],
    description: 'Removes rooms with no active participants'
  },
  'seed-guest-users': {
    path: 'scripts/seed-guest-users.js',
    params: ['50'], // Default to 50 users
    description: 'Seeds 50 guest users with random usernames'
  },
  'insert-sample-messages': {
    path: 'scripts/insert-sample-messages.js',
    params: [],
    description: 'Inserts 5 sample messages into each active room'
  },
  'simulate-room-activity': {
    path: 'scripts/simulate-room-activity.js',
    params: ['--interval', '10', '--duration', '300'], // 10 second interval, 5 minutes duration
    description: 'Simulates room activity by inserting messages randomly'
  },
  'stop-simulation': {
    path: 'pkill -f "node scripts/simulate-room-activity.js"',
    isCommand: true,
    params: [],
    description: 'Stops all running simulations'
  },
  'update-room-analytics': {
    path: 'scripts/update-room-analytics.js',
    params: [],
    description: 'Updates room analytics data'
  },
  'seed-demo-mode': {
    path: 'scripts/seed-demo-mode.js',
    params: [],
    description: 'Sets up demo mode with curated rooms and messages'
  }
};

/**
 * API route to run maintenance scripts from the admin dashboard
 */
export async function POST(req: NextRequest) {
  try {
    // Check for authentication
    // In a real app, you'd use getServerSession or similar to verify the user is an admin
    // For now, we'll use a simple API key check
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.INTERNAL_API_KEY;
    
    if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
      // If no API key is set, check if this is a development environment
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // In development, we'll log a warning but still allow the request
      console.warn('WARNING: Bypassing auth check in development mode. Set INTERNAL_API_KEY for security.');
    }
    
    // Get the script name from the request
    type ScriptName = keyof typeof SCRIPTS;

    const { script } = await req.json() as { script?: ScriptName };

    if (!script || !(script in SCRIPTS)) {
      return NextResponse.json(
        { error: 'Invalid script name' },
        { status: 400 }
      );
    }
    
    const scriptConfig = SCRIPTS[script];
    
    // Execute the script
    try {
      let command;
      if (scriptConfig.isCommand) {
        // If it's a direct command, use it as is
        command = scriptConfig.path;
      } else {
        // Otherwise, construct a node command
        command = `node ${scriptConfig.path} ${(scriptConfig.params || []).join(' ')}`;
      }
      
      console.log(`Executing: ${command}`);
      
      // Execute the command
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr) {
        console.error(`Script error: ${stderr}`);
      }
      
      // Return the results
      return NextResponse.json({
        success: true,
        message: `${scriptConfig.description} completed successfully`,
        output: stdout.substring(0, 1000) // Limit output size
      });
    } catch (execError: unknown) {
      console.error(`Error executing script: ${execError instanceof Error ? execError.message : String(execError)}`);
      return NextResponse.json(
        { error: `Script execution failed: ${execError instanceof Error ? execError.message : String(execError)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error running script:', error);
    return NextResponse.json(
      { error: 'Failed to run script', details: String(error) },
      { status: 500 }
    );
  }
}
