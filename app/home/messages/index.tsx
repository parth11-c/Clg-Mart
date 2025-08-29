import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../../lib/supabase';
import SafeAreaWrapper from '../../../components/SafeAreaWrapper';
import { responsiveValue, fontSizes } from '../../../lib/responsive';

interface Profile {
  username: string;
  avatar_url?: string;
}

interface Participant {
  user_id: string;
  profile: Profile;
}

interface Conversation {
  id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
  };
  participants: Participant[];
  latest_message?: {
    content: string;
    created_at: string;
  };
}

interface DatabaseConversation {
  id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
  }[];
  participants: {
    user_id: string;
    profile: {
      username: string;
      avatar_url: string | null;
    }[];
  }[];
}

interface FormattedConversation {
  id: string;
  created_at: string;
  listing: {
    id: string;
    title: string;
  };
  participants: {
    user_id: string;
    username: string;
    avatar_url?: string;
  }[];
  latest_message?: {
    content: string;
    created_at: string;
  };
}

export default function MessagesScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  async function fetchConversations() {
    try {
      setLoading(true);
      
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      
      if (!user) {
        router.replace('/auth');
        return;
      }

      // Fetch conversations where the current user is a participant
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          created_at,
          listing:listing_id (id, title),
          participants:conversation_participants (
            user_id,
            profile:user_id (username, avatar_url)
          )
        `)
        .eq('conversation_participants.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data
      const formattedConversations = (data as DatabaseConversation[]).map((conv) => {
        // Format participants data
        const participants = conv.participants.map((p) => ({
          user_id: p.user_id,
          username: p.profile[0]?.username || 'Unknown user',
          avatar_url: p.profile[0]?.avatar_url || undefined,
        }));

        const listing = conv.listing[0];
        return {
          id: conv.id,
          created_at: conv.created_at,
          listing: {
            id: listing?.id || '',
            title: listing?.title || 'Unknown listing'
          },
          participants
        } as FormattedConversation;
      });

      // Fetch latest message for each conversation
      const conversationsWithMessages = await Promise.all(
        formattedConversations.map(async (conv) => {
          const { data: messages, error } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) throw error;
          
          return {
            ...conv,
            latest_message: messages && messages[0] ? messages[0] : undefined
          };
        })
      );

      setConversations(conversationsWithMessages);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Within the last week
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    if (date > oneWeekAgo) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older than a week
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Keep track of current user ID
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Get current user ID
  useEffect(() => {
    async function getCurrentUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setCurrentUserId(data.user.id);
      }
    }
    getCurrentUser();
  }, []);

  function renderConversation({ item }: { item: any }) {
    // Filter out the current user from participants
    const otherParticipants = item.participants.filter((p: any) => p.user_id !== currentUserId);
    const otherUserName = otherParticipants.length > 0 ? otherParticipants[0].username : 'Unknown user';
    
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/home/messages/${item.id}`)}
      >
        <View style={styles.conversationContent}>
          <Text style={styles.conversationTitle} numberOfLines={1}>
            {otherUserName}
          </Text>
          <Text style={styles.listingTitle} numberOfLines={1}>
            {item.listing?.title || 'Deleted listing'}
          </Text>
          <Text style={styles.messagePreview} numberOfLines={1}>
            {item.latest_message?.content || 'No messages yet'}
          </Text>
        </View>
        <View style={styles.conversationMeta}>
          {item.latest_message && (
            <Text style={styles.timestamp}>
              {formatDate(item.latest_message.created_at)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        ) : conversations.length > 0 ? (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversation}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No messages yet</Text>
            <Text style={styles.emptyStateSubtext}>
              When you contact sellers or buyers, your conversations will appear here
            </Text>
          </View>
        )}
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: responsiveValue(16, 24),
    paddingVertical: responsiveValue(12, 16),
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: responsiveValue(fontSizes.xl, fontSizes.xxl),
    fontWeight: 'bold',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  listContainer: {
    paddingBottom: responsiveValue(16, 24),
    backgroundColor: '#000000',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: responsiveValue(16, 20),
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    backgroundColor: '#000000',
  },
  conversationContent: {
    flex: 1,
    backgroundColor: '#000000',
  },
  conversationTitle: {
    fontSize: responsiveValue(fontSizes.md, fontSizes.lg),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(2, 4),
  },
  listingTitle: {
    fontSize: responsiveValue(fontSizes.sm, fontSizes.md),
    fontWeight: '500',
    color: '#aaaaaa',
    marginBottom: responsiveValue(4, 6),
  },
  messagePreview: {
    fontSize: responsiveValue(fontSizes.sm, fontSizes.md),
    color: '#888888',
  },
  conversationMeta: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingLeft: responsiveValue(8, 12),
    backgroundColor: '#000000',
  },
  timestamp: {
    fontSize: responsiveValue(fontSizes.xs, fontSizes.sm),
    color: '#666666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveValue(24, 32),
  },
  emptyStateText: {
    fontSize: responsiveValue(fontSizes.lg, fontSizes.xl),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(8, 12),
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: responsiveValue(fontSizes.sm, fontSizes.md),
    color: '#888888',
    textAlign: 'center',
  },
});
