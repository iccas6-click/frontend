import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

export function Screen({
  children,
  bottom,
}: {
  children: ReactNode;
  bottom?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.body}>{children}</View>
      {bottom ? (
        <SafeAreaView edges={['bottom']} style={styles.bottom}>
          {bottom}
        </SafeAreaView>
      ) : null}
    </SafeAreaView>
  );
}

export function TopBar({
  title,
  subtitle,
  backLabel,
  onBack,
  right,
}: {
  title?: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={styles.topBar}>
      <View style={styles.navRow}>
        {onBack ? (
          <Pressable
            style={styles.backButton}
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`${backLabel ?? '뒤로'}로 이동`}>
            <Ionicons name="chevron-back" size={22} color={Palette.primary} />
            <Text style={styles.backText}>{backLabel ?? '뒤로'}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {right}
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function IconBadge({
  icon,
  tone = 'blue',
  size = 'md',
}: {
  icon: IconName;
  tone?: 'blue' | 'green' | 'red' | 'amber' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}) {
  const toneStyle = badgeTone[tone];
  const boxSize = size === 'lg' ? 58 : size === 'sm' ? 38 : 48;
  const iconSize = size === 'lg' ? 27 : size === 'sm' ? 18 : 23;
  return (
    <View
      style={[
        styles.iconBadge,
        { width: boxSize, height: boxSize, borderRadius: size === 'sm' ? Radius.sm : Radius.md },
        { backgroundColor: toneStyle.bg },
      ]}>
      <Ionicons name={icon} size={iconSize} color={toneStyle.color} />
    </View>
  );
}

export function ActionCard({
  icon,
  tone = 'blue',
  title,
  subtitle,
  meta,
  onPress,
}: {
  icon: IconName;
  tone?: 'blue' | 'green' | 'red' | 'amber' | 'dark';
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}>
      <IconBadge icon={icon} tone={tone} />
      <View style={styles.cardText}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={19} color={Palette.textSubtle} /> : null}
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  icon,
  onPress,
  disabled,
  variant = 'primary',
  accessibilityHint,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  accessibilityHint?: string;
}) {
  const variantStyle =
    variant === 'secondary' ? styles.secondaryButton : variant === 'danger' ? styles.dangerButton : styles.primaryButton;
  const textStyle =
    variant === 'secondary' ? styles.secondaryButtonText : variant === 'danger' ? styles.dangerButtonText : styles.primaryButtonText;
  const iconColor = variant === 'secondary' ? Palette.primary : variant === 'danger' ? Palette.rose : '#FFFFFF';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variantStyle,
        disabled && styles.buttonDisabled,
        pressed && !disabled ? styles.pressed : null,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}>
      {icon ? <Ionicons name={icon} size={19} color={iconColor} /> : null}
      <Text style={textStyle}>{label}</Text>
    </Pressable>
  );
}

const badgeTone = {
  blue: { bg: Palette.primarySoft, color: Palette.primary },
  green: { bg: Palette.mintSoft, color: Palette.mint },
  red: { bg: Palette.roseSoft, color: Palette.rose },
  amber: { bg: Palette.amberSoft, color: Palette.amber },
  dark: { bg: Palette.surfaceMuted, color: Palette.blueGrey },
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  body: {
    flex: 1,
  },
  bottom: {
    backgroundColor: Palette.background,
    borderTopColor: Palette.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.screen,
    paddingTop: 12,
    paddingBottom: 12,
  },
  topBar: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 8,
    paddingBottom: 18,
  },
  navRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
  },
  backText: {
    color: Palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  title: {
    ...Typography.title,
    color: Palette.text,
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.screen,
    marginTop: 2,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    ...Typography.section,
    color: Palette.text,
  },
  card: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Palette.border,
    padding: 16,
    ...Shadow.subtle,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
  iconBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    color: Palette.text,
  },
  cardSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    color: Palette.textMuted,
    marginTop: 3,
  },
  button: {
    minHeight: 60,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Palette.primary,
  },
  secondaryButton: {
    backgroundColor: Palette.primarySoft,
  },
  dangerButton: {
    backgroundColor: Palette.roseSoft,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: Palette.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  dangerButtonText: {
    color: Palette.rose,
    fontSize: 18,
    fontWeight: '900',
  },
  buttonDisabled: {
    opacity: 0.42,
  },
});
