

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useDeviceContext } from '../../hooks/useDeviceContext';
import { Button, Card, SectionHeader, StatusBadge } from '../ui/SharedComponents';

export default function DevPanelScreen() {
  const {
    deviceId,
    state,
    notifications,
    isOnline,
    isSyncing,
    unsyncedCount,
    setOnline,
    sync,
    resetDevice,
  } = useDeviceContext();

  const [showOps, setShowOps] = useState(false);
  const [showFullState, setShowFullState] = useState(false);

  const handleToggleOnline = useCallback(async (value: boolean) => {
    await setOnline(value);
  }, [setOnline]);

  const handleSync = useCallback(async () => {
    await sync();
  }, [sync]);

  const handleReset = useCallback(async () => {
    await resetDevice();
  }, [resetDevice]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Device Info */}
      <Card style={styles.deviceCard}>
        <View style={styles.deviceHeader}>
          <View>
            <Text style={styles.deviceLabel}>DEVICE</Text>
            <Text style={styles.deviceId}>{deviceId.toUpperCase()}</Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, isOnline ? styles.statusOnline : styles.statusOffline]} />
            <Text style={styles.statusText}>{isOnline ? 'ONLINE' : 'OFFLINE'}</Text>
          </View>
        </View>
      </Card>

      {/* Network Control */}
      <SectionHeader title="Network" subtitle="Simulate connectivity" />
      <Card>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Network Connection</Text>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: '#E0E0E0', true: '#000000' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.syncRow}>
          <View>
            <Text style={styles.syncLabel}>Pending Operations</Text>
            <Text style={styles.syncCount}>{unsyncedCount} unsynced</Text>
          </View>
          <Button
            title={isSyncing ? 'Syncing...' : 'Sync Now'}
            variant="primary"
            size="small"
            onPress={handleSync}
            disabled={!isOnline || isSyncing}
          />
        </View>

        <View style={styles.counterRow}>
          <Text style={styles.counterLabel}>Last Sync Counter</Text>
          <Text style={styles.counterValue}>{state.lastSyncCounter}</Text>
        </View>
      </Card>

      {/* Stats Overview */}
      <SectionHeader title="Current Stats" subtitle="Local device state" />
      <Card>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Streak</Text>
            <Text style={styles.statItemValue}>{state.stats.streak} 🔥</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Coins</Text>
            <Text style={styles.statItemValue}>{state.stats.coins} 🪙</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Today</Text>
            <Text style={styles.statItemValue}>{state.stats.todayFocusMinutes} min</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statItemLabel}>Sessions</Text>
            <Text style={styles.statItemValue}>{state.sessions.length}</Text>
          </View>
        </View>
      </Card>

      {/* Notifications (n8n) */}
      <SectionHeader title="Notifications" subtitle="n8n webhook events — should fire exactly once per session" />
      <Card>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications yet. Complete a focus session and sync.</Text>
        ) : (
          notifications.map((n, i) => (
            <View key={i} style={styles.notifItem}>
              <Text style={styles.notifMessage}>📱 {n.message}</Text>
              <Text style={styles.notifMeta}>
                Session: {n.sessionId.substring(0, 8)}... • {new Date(n.firedAt).toLocaleTimeString()}
              </Text>
            </View>
          ))
        )}
      </Card>

      {/* Operation Log */}
      <SectionHeader title="Operation Log" subtitle={`${state.operations.length} total operations`} />
      <Card>
        <TouchableOpacity onPress={() => setShowOps(!showOps)}>
          <Text style={styles.toggleText}>{showOps ? '▼ Hide' : '▶ Show'} Operations</Text>
        </TouchableOpacity>
        {showOps && state.operations.map((op, i) => (
          <View key={op.id} style={styles.opItem}>
            <View style={styles.opHeader}>
              <Text style={styles.opType}>{op.type}</Text>
              <StatusBadge
                status={op.synced ? 'SYNCED' : 'PENDING'}
                variant={op.synced ? 'success' : 'warning'}
              />
            </View>
            <Text style={styles.opMeta}>
              ID: {op.id.substring(0, 8)}... • Device: {op.deviceId} • HLC: {op.hlc.wallTime}:{op.hlc.counter}
            </Text>
          </View>
        ))}
      </Card>

      {/* Full State Debug */}
      <SectionHeader title="Full State" subtitle="Raw JSON state of this device" />
      <Card>
        <TouchableOpacity onPress={() => setShowFullState(!showFullState)}>
          <Text style={styles.toggleText}>{showFullState ? '▼ Hide' : '▶ Show'} Full State</Text>
        </TouchableOpacity>
        {showFullState && (
          <ScrollView horizontal>
            <Text style={styles.jsonText}>
              {JSON.stringify({
                subjects: state.subjects.map(s => ({
                  ...s,
                  chapters: s.chapters.map(c => ({
                    ...c,
                    tasks: c.tasks.map(t => ({
                      id: t.id,
                      title: t.title,
                      status: t.status,
                      deleted: t.deleted,
                    })),
                  })),
                })),
                sessions: state.sessions,
                stats: state.stats,
              }, null, 2)}
            </Text>
          </ScrollView>
        )}
      </Card>

      {/* Reset */}
      <View style={styles.resetSection}>
        <Button
          title="Reset This Device"
          variant="danger"
          size="medium"
          onPress={handleReset}
        />
      </View>
    </ScrollView>
  );
}

// ----------------------------------------------------------
// Styles
// ----------------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  deviceCard: {
    backgroundColor: '#000000',
    marginBottom: 16,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceLabel: {
    fontSize: 11,
    color: '#666666',
    letterSpacing: 1,
  },
  deviceId: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOnline: {
    backgroundColor: '#FFFFFF',
  },
  statusOffline: {
    backgroundColor: '#666666',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  switchLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  syncLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  syncCount: {
    fontSize: 12,
    color: '#999999',
    marginTop: 1,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  counterLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  counterValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: '40%',
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statItemLabel: {
    fontSize: 11,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },
  notifItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  notifMessage: {
    fontSize: 14,
    color: '#000000',
  },
  notifMeta: {
    fontSize: 11,
    color: '#999999',
    marginTop: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000000',
    paddingVertical: 4,
  },
  opItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  opHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  opType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    fontFamily: 'monospace',
  },
  opMeta: {
    fontSize: 10,
    color: '#AAAAAA',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  jsonText: {
    fontSize: 10,
    color: '#666666',
    fontFamily: 'monospace',
    marginTop: 8,
    lineHeight: 16,
  },
  resetSection: {
    marginTop: 24,
    marginBottom: 40,
    alignItems: 'center',
  },
});
