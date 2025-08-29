-- Create messages table
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Enable Row Level Security for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view messages in their conversations
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
    );

-- Create policy to allow users to send messages in their conversations
CREATE POLICY "Users can send messages in their conversations" ON messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = conversation_id
            AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );

-- Create conversations_with_details view
CREATE OR REPLACE VIEW conversations_with_details AS
SELECT 
    c.*,
    b.username as buyer_username,
    b.avatar_url as buyer_avatar_url,
    s.username as seller_username,
    s.avatar_url as seller_avatar_url,
    l.title as listing_title,
    l.price as listing_price,
    (
        SELECT content 
        FROM messages m 
        WHERE m.conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) as last_message,
    (
        SELECT created_at 
        FROM messages m 
        WHERE m.conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ) as last_message_at
FROM conversations c
LEFT JOIN profiles b ON c.buyer_id = b.id
LEFT JOIN profiles s ON c.seller_id = s.id
LEFT JOIN listings l ON c.listing_id = l.id;

-- Create messages_with_sender view
CREATE OR REPLACE VIEW messages_with_sender AS
SELECT 
    m.*,
    p.username as sender_username,
    p.avatar_url as sender_avatar_url,
    p.id as sender_profile_id,
    c.buyer_id,
    c.seller_id,
    CASE 
        WHEN p.id = c.buyer_id THEN 'buyer'
        WHEN p.id = c.seller_id THEN 'seller'
    END as sender_role
FROM messages m
LEFT JOIN profiles p ON m.sender_id = p.id
LEFT JOIN conversations c ON m.conversation_id = c.id;

-- Create function to handle realtime messages
CREATE OR REPLACE FUNCTION handle_new_message()
RETURNS TRIGGER AS $$
DECLARE
    sender_info json;
    conversation_info json;
BEGIN
    -- Get sender information
    SELECT json_build_object(
        'id', p.id,
        'username', p.username,
        'avatar_url', p.avatar_url
    ) INTO sender_info
    FROM profiles p
    WHERE p.id = NEW.sender_id;

    -- Get conversation information
    SELECT json_build_object(
        'buyer_id', c.buyer_id,
        'seller_id', c.seller_id
    ) INTO conversation_info
    FROM conversations c
    WHERE c.id = NEW.conversation_id;

    perform pg_notify(
        'new_message',
        json_build_object(
            'id', NEW.id,
            'conversation_id', NEW.conversation_id,
            'sender_id', NEW.sender_id,
            'content', NEW.content,
            'created_at', NEW.created_at,
            'sender', sender_info,
            'conversation', conversation_info
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for realtime messages
CREATE TRIGGER on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message();
