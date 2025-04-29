import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Add nodejs runtime for better Vercel compatibility
export const runtime = 'nodejs';

// Replace in-memory storage with database storage for serverless compatibility
// Define a table name for storing peer information
const PEERS_TABLE = 'room_peers';

// GET endpoint to fetch all peers in a room
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id;
    
    // Query database for peers instead of using in-memory storage
    const { data, error } = await supabase
      .from(PEERS_TABLE)
      .select('peer_id')
      .eq('room_id', roomId);
      
    if (error) throw error;
    
    // Transform data to match expected format
    const peers = data?.map(item => item.peer_id) || [];
    
    // Return the list of peers for this room
    return NextResponse.json({
      peers
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
    
    // Check if peer already exists in the room
    const { data: existingPeer, error: checkError } = await supabase
      .from(PEERS_TABLE)
      .select('id')
      .eq('room_id', roomId)
      .eq('peer_id', peerId)
      .maybeSingle();
      
    if (checkError) throw checkError;
    
    // Only add peer if not already in the room
    if (!existingPeer) {
      const { error: insertError } = await supabase
        .from(PEERS_TABLE)
        .insert({
          room_id: roomId,
          peer_id: peerId,
          joined_at: new Date().toISOString()
        });
        
      if (insertError) throw insertError;
      
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
    
    // Get all peers in the room after adding
    const { data: allPeers, error: fetchError } = await supabase
      .from(PEERS_TABLE)
      .select('peer_id')
      .eq('room_id', roomId);
      
    if (fetchError) throw fetchError;
    
    return NextResponse.json({
      success: true,
      peers: allPeers?.map(item => item.peer_id) || []
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
    
    // Delete peer from database
    const { error: deleteError } = await supabase
      .from(PEERS_TABLE)
      .delete()
      .eq('room_id', roomId)
      .eq('peer_id', peerId);
      
    if (deleteError) throw deleteError;
    
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
    
    // Get updated list of peers
    const { data: remainingPeers, error: fetchError } = await supabase
      .from(PEERS_TABLE)
      .select('peer_id')
      .eq('room_id', roomId);
      
    if (fetchError) throw fetchError;
    
    return NextResponse.json({
      success: true,
      peers: remainingPeers?.map(item => item.peer_id) || []
    });
  } catch (error) {
    console.error('Error removing peer:', error);
    return NextResponse.json(
      { error: 'Failed to remove peer', details: String(error) },
      { status: 500 }
    );
  }
}
