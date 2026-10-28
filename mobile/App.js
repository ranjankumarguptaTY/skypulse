import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ChatProvider } from './src/context/ChatContext';
import { SecretSearchModal } from './src/components/SecretSearchModal';

import { WeatherScreen } from './src/screens/WeatherScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { NotesScreen } from './src/screens/NotesScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  const { isAuthenticated } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d1f',
          borderTopColor: 'rgba(255,255,255,0.06)',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#00d4ff',
        tabBarInactiveTintColor: '#5c5c72',
      }}
    >
      <Tab.Screen
        name="Radar"
        component={WeatherScreen}
        options={{
          tabBarLabel: 'Radar',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18 }}>⛅</Text>,
        }}
      />
      {isAuthenticated && (
        <>
          <Tab.Screen
            name="Notes"
            component={NotesScreen}
            options={{
              tabBarLabel: 'Notes',
              tabBarIcon: () => <Text style={{ fontSize: 18 }}>📝</Text>,
            }}
          />
          <Tab.Screen
            name="Monitor"
            component={FeedScreen}
            options={{
              tabBarLabel: 'Monitor',
              tabBarIcon: () => <Text style={{ fontSize: 18 }}>📡</Text>,
            }}
          />
          <Tab.Screen
            name="Config"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Config',
              tabBarIcon: () => <Text style={{ fontSize: 18 }}>⚙️</Text>,
            }}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

function NavigationRoot() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Auth" component={AuthScreen} />
      </Stack.Navigator>
      <SecretSearchModal />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <StatusBar style="light" />
        <NavigationRoot />
      </ChatProvider>
    </AuthProvider>
  );
}
