import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// In-memory storage for peers (in a production app, this would be a database)
const roomPeers: Record<string, string[]> = {};

// GET endpoint to fetch all peers in a room
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    
    // Return the list of peers for this room
    return NextResponse.json({
      peers: roomPeers[roomId] || [],
    });
  } catch (error) {
    console.error('Error fetching peers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peers' },
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
    
    // Initialize room if it doesn't exist
    if (!roomPeers[roomId]) {
      roomPeers[roomId] = [];
    }
    
    // Add peer if not already in the room
    if (!roomPeers[roomId].includes(peerId)) {
      roomPeers[roomId].push(peerId);
      
      // Log activity
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.from("activity_logs").insert({
          room_id: roomId,
          user_id: user.user.id,
          action: "joined_video_call",
          details: { peerId }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      peers: roomPeers[roomId]
    });
  } catch (error) {
    console.error('Error adding peer:', error);
    return NextResponse.json(
      { error: 'Failed to add peer' },
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
    
    // Remove peer if room exists
    if (roomPeers[roomId]) {
      roomPeers[roomId] = roomPeers[roomId].filter(id => id !== peerId);
      
      // Log activity
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.from("activity_logs").insert({
          room_id: roomId,
          user_id: user.user.id,
          action: "left_video_call",
          details: { peerId }
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      peers: roomPeers[roomId] || []
    });
  } catch (error) {
    console.error('Error removing peer:', error);
    return NextResponse.json(
      { error: 'Failed to remove peer' },
      { status: 500 }
    );
  }
}
