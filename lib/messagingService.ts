import { supabase } from './supabase';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    username: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  listing_id: string;
  created_at: string;
  updated_at: string;
  listing_title: string;
  listing_price: number;
  participants: {
    user_id: string;
    username: string;
    avatar_url?: string;
  }[];
  latest_message?: Message;
}

class MessagingService {
  // Start a new conversation
  async startConversation(listingId: string, sellerId: string, buyerId: string): Promise<string | null> {
    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({ listing_id: listingId })
        .select('id')
        .single();

      if (convError) throw convError;

      // Add participants
      const { error: partError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: conversation.id, user_id: sellerId },
          { conversation_id: conversation.id, user_id: buyerId }
        ]);

      if (partError) throw partError;

      return conversation.id;
    } catch (error) {
      console.error('Error starting conversation:', error);
      return null;
    }
  }

  // Send a message
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content: content
        })
        .select('*, sender:profiles(username, avatar_url)')
        .single();

      if (error) throw error;

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  // Get user's conversations
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data, error } = await supabase
        .from('conversations_with_details')
        .select(`
          id,
          created_at,
          updated_at,
          listing_id,
          listing_title,
          listing_price,
          participants:conversation_participants(
            user_id,
            profile:profiles(username, avatar_url)
          ),
          latest_message:messages(
            id,
            content,
            created_at,
            sender_id,
            is_read
          )
        `)
        .eq('conversation_participants.user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match the Conversation interface
      const conversations: Conversation[] = (data || []).map(conv => ({
        id: conv.id,
        listing_id: conv.listing_id,
        created_at: conv.created_at,
        updated_at: conv.updated_at,
        listing_title: conv.listing_title,
        listing_price: conv.listing_price,
        participants: conv.participants.map(p => ({
          user_id: p.user_id,
          username: p.profile[0]?.username || '',
          avatar_url: p.profile[0]?.avatar_url
        })),
        latest_message: conv.latest_message?.[0] ? {
          id: conv.latest_message[0].id,
          conversation_id: conv.id,
          sender_id: conv.latest_message[0].sender_id,
          content: conv.latest_message[0].content,
          created_at: conv.latest_message[0].created_at,
          is_read: conv.latest_message[0].is_read
        } : undefined
      }));

      return conversations;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:profiles(username, avatar_url)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  // Subscribe to new messages in a conversation
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }
}

export const messagingService = new MessagingService();
