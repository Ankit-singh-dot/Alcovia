

import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useDeviceContext } from '../../src/hooks/useDeviceContext';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {icon}
    </Text>
  );
}

export default function TabLayout() {
  const { deviceId, isOnline, unsyncedCount } = useDeviceContext();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#AAAAAA',
        tabBarLabelStyle: styles.tabLabel,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerRight: () => (
          <View style={styles.headerRight}>
            <View style={[styles.onlineDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.headerDevice}>{deviceId.toUpperCase()}</Text>
            {unsyncedCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unsyncedCount}</Text>
              </View>
            )}
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Focus',
          headerTitle: 'Focus Session',
          tabBarIcon: ({ focused }) => <TabIcon icon="⏱" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="syllabus"
        options={{
          title: 'Syllabus',
          headerTitle: 'Syllabus Progress',
          tabBarIcon: ({ focused }) => <TabIcon icon="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="devpanel"
        options={{
          title: 'Dev Panel',
          headerTitle: 'Developer Panel',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    shadowOpacity: 0,
    elevation: 0,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 17,
    color: '#000000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: '#000000',
  },
  dotOffline: {
    backgroundColor: '#CCCCCC',
  },
  headerDevice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 1,
  },
  badge: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});
