

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  AppState,
  AppStateStatus,
  Alert,
} from 'react-native';
import { useDeviceContext } from '../../hooks/useDeviceContext';
import { startSession, completeSession, failSession } from '../../services/focus-service';
import { Button, Card, StatBox, SectionHeader, StatusBadge } from '../ui/SharedComponents';

const DURATION_OPTIONS = [1, 5, 25, 45, 60]; // minutes
const GRACE_PERIOD_MS = 5000; // 5 seconds grace for app switch

export default function FocusScreen() {
  const { store, hlc, state, refreshState, deviceId } = useDeviceContext();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const backgroundTimeRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // ----------------------------------------------------------
  // App State Monitoring (background detection)
  // ----------------------------------------------------------
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (activeSessionId) {
        if (appStateRef.current === 'active' && nextState !== 'active') {
          // App went to background — start grace period
          backgroundTimeRef.current = Date.now();
          console.log(`[FOCUS] App backgrounded, grace period started`);
        } else if (appStateRef.current !== 'active' && nextState === 'active') {
          // App came back to foreground — check grace period
          if (backgroundTimeRef.current) {
            const elapsed = Date.now() - backgroundTimeRef.current;
            if (elapsed > GRACE_PERIOD_MS) {
              // Grace period exceeded — fail the session
              handleFail('app_switch');
            }
            backgroundTimeRef.current = null;
          }
        }
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [activeSessionId]);

  // ----------------------------------------------------------
  // Timer
  // ----------------------------------------------------------
  useEffect(() => {
    if (activeSessionId && remainingSeconds > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            // Timer complete!
            clearInterval(timerRef.current!);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeSessionId]);

  // ----------------------------------------------------------
  // Session Actions
  // ----------------------------------------------------------
  const handleStart = useCallback(async () => {
    const sessionId = await startSession(store, hlc, selectedDuration);
    setActiveSessionId(sessionId);
    setRemainingSeconds(selectedDuration * 60);
    setSessionStartTime(Date.now());
    refreshState();
  }, [store, hlc, selectedDuration, refreshState]);

  const handleComplete = useCallback(async () => {
    if (!activeSessionId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    await completeSession(store, hlc, activeSessionId, selectedDuration);
    setActiveSessionId(null);
    setRemainingSeconds(0);
    setSessionStartTime(null);
    refreshState();
  }, [activeSessionId, store, hlc, selectedDuration, refreshState]);

  const handleFail = useCallback(async (reason: 'give_up' | 'app_switch') => {
    if (!activeSessionId) return;
    if (timerRef.current) clearInterval(timerRef.current);
    await failSession(store, hlc, activeSessionId, reason);
    setActiveSessionId(null);
    setRemainingSeconds(0);
    setSessionStartTime(null);
    refreshState();
  }, [activeSessionId, store, hlc, refreshState]);

  // ----------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------
  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = activeSessionId
    ? ((selectedDuration * 60 - remainingSeconds) / (selectedDuration * 60)) * 100
    : 0;

  const stats = state.stats;
  const recentSessions = state.sessions.slice(-5).reverse();

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatBox icon="🔥" value={stats.streak} label="Streak" />
        <StatBox icon="🪙" value={stats.coins} label="Coins" />
        <StatBox icon="⏱" value={stats.todayFocusMinutes} label="Min today" />
      </View>

      {/* Timer Area */}
      <Card style={styles.timerCard}>
        {!activeSessionId ? (
          <>
            <Text style={styles.timerLabel}>Select Duration</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map(d => (
                <Button
                  key={d}
                  title={`${d}m`}
                  variant={selectedDuration === d ? 'primary' : 'secondary'}
                  size="small"
                  onPress={() => setSelectedDuration(d)}
                  style={styles.durationBtn}
                />
              ))}
            </View>
            <Button
              title="Start Focus Session"
              onPress={handleStart}
              variant="primary"
              size="large"
              style={styles.startBtn}
            />
          </>
        ) : (
          <>
            <Text style={styles.timerLabel}>Focusing...</Text>
            <Text style={styles.timerDisplay}>{formatTime(remainingSeconds)}</Text>

            {/* Progress ring (simplified as bar) */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBar, { width: `${progress}%` }]} />
            </View>

            <Text style={styles.timerSubtext}>
              {selectedDuration} min session • Stay focused
            </Text>

            <View style={styles.actionRow}>
              <Button
                title="Give Up"
                variant="secondary"
                onPress={() => handleFail('give_up')}
                style={styles.giveUpBtn}
              />
            </View>
          </>
        )}
      </Card>

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <View>
          <SectionHeader title="Recent Sessions" />
          {recentSessions.map(session => (
            <Card key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionDuration}>
                    {session.targetDuration} min
                  </Text>
                  <Text style={styles.sessionTime}>
                    {new Date(session.startedAt).toLocaleTimeString()}
                  </Text>
                </View>
                <StatusBadge
                  status={session.status}
                  variant={session.status === 'success' ? 'success' : session.status === 'failed' ? 'error' : 'default'}
                />
              </View>
              {session.failReason && (
                <Text style={styles.failReason}>
                  Reason: {session.failReason === 'give_up' ? 'Gave up' : 'App switched'}
                </Text>
              )}
            </Card>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 16,
  },
  timerCard: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  durationBtn: {
    minWidth: 50,
  },
  startBtn: {
    width: '100%',
    marginTop: 8,
  },
  timerDisplay: {
    fontSize: 72,
    fontWeight: '200',
    color: '#000000',
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginVertical: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  timerSubtext: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 20,
  },
  actionRow: {
    width: '100%',
  },
  giveUpBtn: {
    width: '100%',
  },
  sessionCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  sessionTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  failReason: {
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
