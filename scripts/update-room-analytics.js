// Script to update room analytics data
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to ensure the room_analytics table exists
async function ensureRoomAnalyticsTable() {
  try {
    // Check if the room_analytics table exists
    const { data: tables, error: tablesError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'room_analytics');
    
    if (tablesError) {
      console.error('Error checking for room_analytics table:', tablesError);
      // Continue anyway, the table creation will fail if there's a real issue
    }
    
    // If the table doesn't exist, create it
    if (!tables || tables.length === 0) {
      console.log('Creating room_analytics table...');
      
      // Execute SQL to create the table
      const { error: createError } = await supabase.rpc('execute_sql', {
        query: `
          CREATE TABLE IF NOT EXISTS room_analytics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
            total_messages INTEGER DEFAULT 0,
            total_participants INTEGER DEFAULT 0,
            active_participants INTEGER DEFAULT 0,
            last_message_at TIMESTAMP WITH TIME ZONE,
            last_participant_joined_at TIMESTAMP WITH TIME ZONE,
            last_active_at TIMESTAMP WITH TIME ZONE,
            is_trending BOOLEAN DEFAULT FALSE,
            trending_score FLOAT DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(room_id)
          );
          
          -- Create index for faster lookups
          CREATE INDEX IF NOT EXISTS room_analytics_room_id_idx ON room_analytics(room_id);
          CREATE INDEX IF NOT EXISTS room_analytics_trending_idx ON room_analytics(is_trending, trending_score DESC);
        `
      });
      
      if (createError) {
        console.error('Error creating room_analytics table:', createError);
        throw createError;
      }
      
      console.log('room_analytics table created successfully');
    } else {
      console.log('room_analytics table already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring room_analytics table:', error);
    return false;
  }
}

// Function to update analytics for a specific room
async function updateRoomAnalytics(roomId) {
  try {
    // Get room message count
    const { data: messageData, error: messageError } = await supabase
      .from('room_messages')
      .select('id, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (messageError) {
      throw messageError;
    }
    
    // Get total message count
    const { count: messageCount, error: countError } = await supabase
      .from('room_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);
    
    if (countError) {
      throw countError;
    }
    
    // Get participant data
    const { data: participantData, error: participantError } = await supabase
      .from('room_participants')
      .select('id, user_id, joined_at, is_active')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: false })
      .limit(1);
    
    if (participantError) {
      throw participantError;
    }
    
    // Get total participant count
    const { count: totalParticipants, error: totalParticipantsError } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId);
    
    if (totalParticipantsError) {
      throw totalParticipantsError;
    }
    
    // Get active participant count
    const { count: activeParticipants, error: activeParticipantsError } = await supabase
      .from('room_participants')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_active', true);
    
    if (activeParticipantsError) {
      throw activeParticipantsError;
    }
    
    // Calculate last active time (most recent of message or participant join)
    const lastMessageAt = messageData && messageData.length > 0 ? messageData[0].created_at : null;
    const lastParticipantJoinedAt = participantData && participantData.length > 0 ? participantData[0].joined_at : null;
    
    let lastActiveAt = null;
    if (lastMessageAt && lastParticipantJoinedAt) {
      lastActiveAt = new Date(lastMessageAt) > new Date(lastParticipantJoinedAt) ? lastMessageAt : lastParticipantJoinedAt;
    } else {
      lastActiveAt = lastMessageAt || lastParticipantJoinedAt;
    }
    
    // Calculate trending score
    // Simple algorithm: (messages * 1) + (total participants * 2) + (active participants * 3)
    // Weighted by recency (within last hour = 100% weight, within last day = 50%, older = 25%)
    let trendingScore = 0;
    let isTrending = false;
    
    if (lastActiveAt) {
      const now = new Date();
      const lastActive = new Date(lastActiveAt);
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      let recencyWeight = 0.25; // Default for older than a day
      
      if (lastActive >= hourAgo) {
        recencyWeight = 1.0; // Within the last hour
        isTrending = true;
      } else if (lastActive >= dayAgo) {
        recencyWeight = 0.5; // Within the last day
      }
      
      trendingScore = recencyWeight * (
        (messageCount * 1) + 
        (totalParticipants * 2) + 
        (activeParticipants * 3)
      );
      
      // Room is trending if score is above 10 and active within the last hour
      isTrending = isTrending && trendingScore > 10;
    }
    
    // Update or insert analytics
    const { data: existingAnalytics, error: existingError } = await supabase
      .from('room_analytics')
      .select('id')
      .eq('room_id', roomId);
    
    if (existingError) {
      throw existingError;
    }
    
    const analyticsData = {
      room_id: roomId,
      total_messages: messageCount || 0,
      total_participants: totalParticipants || 0,
      active_participants: activeParticipants || 0,
      last_message_at: lastMessageAt,
      last_participant_joined_at: lastParticipantJoinedAt,
      last_active_at: lastActiveAt,
      is_trending: isTrending,
      trending_score: trendingScore,
      updated_at: new Date().toISOString()
    };
    
    if (existingAnalytics && existingAnalytics.length > 0) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('room_analytics')
        .update(analyticsData)
        .eq('room_id', roomId);
      
      if (updateError) {
        throw updateError;
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('room_analytics')
        .insert([analyticsData]);
      
      if (insertError) {
        throw insertError;
      }
    }
    
    return {
      roomId,
      messageCount,
      totalParticipants,
      activeParticipants,
      lastActiveAt,
      isTrending,
      trendingScore
    };
  } catch (error) {
    console.error(`Error updating analytics for room ${roomId}:`, error);
    return null;
  }
}

// Main function to update analytics for all active rooms
async function updateAllRoomAnalytics() {
  try {
    console.log('Starting room analytics update...');
    
    // Ensure the analytics table exists
    const tableExists = await ensureRoomAnalyticsTable();
    if (!tableExists) {
      throw new Error('Failed to ensure room_analytics table exists');
    }
    
    // Get all active rooms
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, name')
      .eq('is_active', true);
    
    if (roomsError) {
      throw roomsError;
    }
    
    if (!rooms || rooms.length === 0) {
      console.log('No active rooms found.');
      return;
    }
    
    console.log(`Found ${rooms.length} active rooms. Updating analytics...`);
    
    // Update analytics for each room
    const results = [];
    for (const room of rooms) {
      console.log(`Updating analytics for room: ${room.name} (${room.id})`);
      const result = await updateRoomAnalytics(room.id);
      if (result) {
        results.push(result);
      }
    }
    
    console.log(`Successfully updated analytics for ${results.length} rooms.`);
    
    // Find trending rooms
    const trendingRooms = results.filter(r => r.isTrending);
    if (trendingRooms.length > 0) {
      console.log(`\nTrending rooms (${trendingRooms.length}):`);
      trendingRooms.forEach(room => {
        console.log(`- Room ${room.roomId}: Score ${room.trendingScore.toFixed(2)}, ${room.activeParticipants} active participants`);
      });
    } else {
      console.log('\nNo trending rooms at the moment.');
    }
    
    return results;
  } catch (error) {
    console.error('Error updating room analytics:', error);
  }
}

// Run the script
(async () => {
  await updateAllRoomAnalytics();
})();
