import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { 
  fontSizes, 
  navigationConfig,
  responsiveValue 
} from '../../lib/responsive';

export default function HomeLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0a0a0a',
            borderTopColor: '#1a1a1a',
            borderTopWidth: 1,
            paddingBottom: responsiveValue(6, 8),
            paddingTop: responsiveValue(6, 8),
            height: navigationConfig.tabBarHeight,
          },
          tabBarActiveTintColor: '#ffffff',
          tabBarInactiveTintColor: '#888888',
          tabBarLabelStyle: {
            fontSize: responsiveValue(fontSizes.xs, 12),
            fontWeight: '500',
            marginTop: responsiveValue(2, 4),
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: responsiveValue(18, 20), color }}>🏠</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="browse"
          options={{
            title: 'Browse',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: responsiveValue(18, 20), color }}>🔍</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="create-listing"
          options={{
            title: 'Create',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: responsiveValue(18, 20), color }}>➕</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Message',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: responsiveValue(18, 20), color }}>💬</Text>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => (
              <Text style={{ fontSize: responsiveValue(18, 20), color }}>👤</Text>
            ),
          }}
        />
        
        {/* Hide all other screens from tab bar */}
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="listing"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </>
  );
}
