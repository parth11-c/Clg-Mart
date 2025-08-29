import { supabase } from './supabase';

export async function setupMessagingTables() {
  try {
    // Create conversations table
    const { error: conversationsError } = await supabase.rpc('create_conversations_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS conversations (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add an index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_conversations_listing 
        ON conversations(listing_id);
      `
    });

    if (conversationsError) throw conversationsError;

    // Create conversation_participants table
    const { error: participantsError } = await supabase.rpc('create_participants_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS conversation_participants (
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          PRIMARY KEY (conversation_id, user_id)
        );

        -- Add indexes for faster lookups
        CREATE INDEX IF NOT EXISTS idx_participants_conversation 
        ON conversation_participants(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_participants_user 
        ON conversation_participants(user_id);
      `
    });

    if (participantsError) throw participantsError;

    // Create messages table
    const { error: messagesError } = await supabase.rpc('create_messages_table', {
      sql: `
        CREATE TABLE IF NOT EXISTS messages (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
          sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          is_read BOOLEAN DEFAULT FALSE
        );

        -- Add indexes for faster lookups and ordering
        CREATE INDEX IF NOT EXISTS idx_messages_conversation 
        ON messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender 
        ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at 
        ON messages(created_at DESC);
      `
    });

    if (messagesError) throw messagesError;

    // Create view for conversations with details
    const { error: viewError } = await supabase.rpc('create_conversations_view', {
      sql: `
        CREATE OR REPLACE VIEW conversations_with_details AS
        SELECT 
          c.id,
          c.created_at,
          c.updated_at,
          l.id as listing_id,
          l.title as listing_title,
          l.price as listing_price,
          cp.user_id,
          p.username,
          p.avatar_url,
          (
            SELECT json_build_object(
              'id', m.id,
              'content', m.content,
              'created_at', m.created_at,
              'sender_id', m.sender_id
            )
            FROM messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as latest_message
        FROM conversations c
        LEFT JOIN listings l ON c.listing_id = l.id
        LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN profiles p ON cp.user_id = p.id;
      `
    });

    if (viewError) throw viewError;

    console.log('Messaging tables created successfully');
    return true;
  } catch (error) {
    console.error('Error setting up messaging tables:', error);
    return false;
  }
}
