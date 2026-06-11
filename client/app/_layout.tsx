
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { DeviceProvider } from '../src/hooks/useDeviceContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [deviceId, setDeviceId] = useState<string>('device-a');

  useEffect(() => {
    // On web, read device ID from URL parameter
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const device = params.get('device');
      if (device === 'b') {
        setDeviceId('device-b');
        document.title = 'Alcovia — Device B';
      } else {
        setDeviceId('device-a');
        document.title = 'Alcovia — Device A';
      }
    }
    SplashScreen.hideAsync();
  }, []);

  return (
    <DeviceProvider deviceId={deviceId}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#000000',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#FAFAFA' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </DeviceProvider>
  );
}
