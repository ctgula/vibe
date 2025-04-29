import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Add nodejs runtime for better Vercel compatibility
export const runtime = 'nodejs';

// In-memory storage for peers (used as fallback if database operations fail)
const roomPeers: Record<string, string[]> = {};

// GET endpoint to fetch all peers in a room
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    
    // Try to get peers from the database first
    try {
      const { data, error } = await supabase
        .from('room_participants')  // Use existing room_participants table as fallback
        .select('user_id, status')
        .eq('room_id', roomId)
        .eq('status', 'online');
        
      if (!error && data) {
        // Transform participant data to peerId format (just use user_id)
        const peers = data.map(item => item.user_id);
        return NextResponse.json({ peers });
      }
    } catch (dbError) {
      console.warn('Falling back to in-memory peers due to DB error:', dbError);
      // Continue to in-memory fallback
    }
    
    // Fallback to in-memory peers if database operation failed
    return NextResponse.json({
      peers: roomPeers[roomId] || [],
    });
  } catch (error) {
    console.error('Error fetching peers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peers', details: String(error) },
      { status: 500 }
    );
  }
}

// POST endpoint to add a peer to a room
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const { peerId } = await request.json();
    
    // Validate input
    if (!peerId) {
      return NextResponse.json(
        { error: 'Peer ID is required' },
        { status: 400 }
      );
    }
    
    // First, try to update the database
    let dbSuccess = false;
    try {
      // Try to update participant status to 'online'
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({ status: 'online' })
        .eq('room_id', roomId)
        .eq('user_id', peerId);
      
      if (!updateError) {
        dbSuccess = true;
      }
      
      // Log activity
      await supabase.from("activity_logs").insert({
        room_id: roomId,
        user_id: peerId,
        action: "joined_video_call"
      });
      
    } catch (dbError) {
      console.warn('Using in-memory fallback due to DB error:', dbError);
      // Continue to in-memory fallback
    }
    
    // Always maintain in-memory state as fallback
    if (!roomPeers[roomId]) {
      roomPeers[roomId] = [];
    }
    
    if (!roomPeers[roomId].includes(peerId)) {
      roomPeers[roomId].push(peerId);
    }
    
    return NextResponse.json({
      success: true,
      source: dbSuccess ? 'database' : 'memory',
      peers: roomPeers[roomId]
    });
  } catch (error) {
    console.error('Error adding peer:', error);
    return NextResponse.json(
      { error: 'Failed to add peer', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a peer from a room
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    const { peerId } = await request.json();
    
    // Validate input
    if (!peerId) {
      return NextResponse.json(
        { error: 'Peer ID is required' },
        { status: 400 }
      );
    }
    
    // First, try to update the database
    let dbSuccess = false;
    try {
      // Try to update participant status to 'offline'
      const { error: updateError } = await supabase
        .from('room_participants')
        .update({ status: 'offline' })
        .eq('room_id', roomId)
        .eq('user_id', peerId);
        
      if (!updateError) {
        dbSuccess = true;
      }
      
      // Log activity
      await supabase.from("activity_logs").insert({
        room_id: roomId,
        user_id: peerId,
        action: "left_video_call"
      });
      
    } catch (dbError) {
      console.warn('Using in-memory fallback due to DB error:', dbError);
      // Continue with in-memory fallback
    }
    
    // Always maintain in-memory state as fallback
    if (roomPeers[roomId]) {
      roomPeers[roomId] = roomPeers[roomId].filter(id => id !== peerId);
    }
    
    return NextResponse.json({
      success: true,
      source: dbSuccess ? 'database' : 'memory',
      peers: roomPeers[roomId] || []
    });
  } catch (error) {
    console.error('Error removing peer:', error);
    return NextResponse.json(
      { error: 'Failed to remove peer', details: String(error) },
      { status: 500 }
    );
  }
}
