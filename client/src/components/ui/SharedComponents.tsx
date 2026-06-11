
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';


interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    styles[`buttonText_${variant}`],
    styles[`buttonText_${size}`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
}

// ----------------------------------------------------------
// Card
// ----------------------------------------------------------
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ----------------------------------------------------------
// Progress Bar
// ----------------------------------------------------------
interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ progress, height = 6, style }: ProgressBarProps) {
  return (
    <View style={[styles.progressContainer, { height }, style]}>
      <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%`, height }]} />
    </View>
  );
}

// ----------------------------------------------------------
// Status Badge
// ----------------------------------------------------------
interface StatusBadgeProps {
  status: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
}

export function StatusBadge({ status, variant = 'default' }: StatusBadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${variant}`]]}>
      <Text style={[styles.badgeText, styles[`badgeText_${variant}`]]}>{status}</Text>
    </View>
  );
}

// ----------------------------------------------------------
// Section Header
// ----------------------------------------------------------
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ----------------------------------------------------------
// Stat Box
// ----------------------------------------------------------
interface StatBoxProps {
  label: string;
  value: string | number;
  icon?: string;
}

export function StatBox({ label, value, icon }: StatBoxProps) {
  return (
    <View style={styles.statBox}>
      {icon && <Text style={styles.statIcon}>{icon}</Text>}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ----------------------------------------------------------
// Styles
// ----------------------------------------------------------
const styles = StyleSheet.create({
  // Button
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  button_primary: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  button_secondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
  },
  button_danger: {
    backgroundColor: '#FFFFFF',
    borderColor: '#333333',
  },
  button_ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  button_disabled: {
    opacity: 0.4,
  },
  button_small: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  button_medium: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  button_large: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonText_primary: {
    color: '#FFFFFF',
  },
  buttonText_secondary: {
    color: '#000000',
  },
  buttonText_danger: {
    color: '#333333',
  },
  buttonText_ghost: {
    color: '#000000',
  },
  buttonText_small: {
    fontSize: 12,
  },
  buttonText_medium: {
    fontSize: 14,
  },
  buttonText_large: {
    fontSize: 16,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    padding: 16,
    marginVertical: 6,
  },

  // Progress Bar
  progressContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: '#000000',
    borderRadius: 4,
  },

  // Badge
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  badge_default: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  badge_success: {
    backgroundColor: '#F0F0F0',
    borderColor: '#000000',
  },
  badge_error: {
    backgroundColor: '#F5F5F5',
    borderColor: '#999999',
  },
  badge_warning: {
    backgroundColor: '#F5F5F5',
    borderColor: '#666666',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  badgeText_default: {
    color: '#666666',
  },
  badgeText_success: {
    color: '#000000',
  },
  badgeText_error: {
    color: '#999999',
  },
  badgeText_warning: {
    color: '#666666',
  },

  // Section Header
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },

  // Stat Box
  statBox: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    minWidth: 90,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  statLabel: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
