import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { databaseSetup } from '../lib/databaseSetup';

export default function RootLayout() {
  useEffect(() => {
    // Initialize database on app start
    const initializeApp = async () => {
      try {
        console.log('Initializing app database...');
        
        // Check database state
        const dbChecks = await databaseSetup.checkDatabase();
        console.log('Database check results:', dbChecks);
        
        // Initialize categories if needed
        await databaseSetup.initializeCategories();
        
        console.log('App initialization complete');
      } catch (error) {
        console.error('Error during app initialization:', error);
      }
    };
    
    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Welcome',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="auth" 
          options={{ 
            title: 'Authentication',
            headerShown: false 
          }} 
        />
        <Stack.Screen 
          name="home" 
          options={{ 
            title: 'Home',
            headerShown: false,
            gestureEnabled: false, // Disable swipe back gesture
            headerBackVisible: false // Hide back button
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
