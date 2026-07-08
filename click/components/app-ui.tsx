import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Palette, Radius, Shadow, Spacing, Typography } from '@/constants/theme';
import { useUserMode } from '@/hooks/use-user-mode';
import { useI18n } from '@/services/i18n';

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
  subtitleNumberOfLines,
  backLabel,
  onBack,
  right,
}: {
  title?: string;
  subtitle?: string;
  subtitleNumberOfLines?: number;
  backLabel?: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const { lowVision } = useUserMode();
  const { tx } = useI18n();
  const displayTitle = title ? tx(title) : title;
  const displaySubtitle = subtitle ? tx(subtitle) : subtitle;
  const displayBackLabel = tx(backLabel ?? '뒤로');
  return (
    <View style={[styles.topBar, lowVision && styles.topBarLowVision]}>
      <View style={[styles.navRow, lowVision && styles.navRowLowVision]}>
        {onBack ? (
          <Pressable
            style={[styles.backButton, lowVision && styles.backButtonLowVision]}
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`${displayBackLabel}`}>
            <Ionicons name="chevron-back" size={lowVision ? 25 : 22} color={Palette.primary} />
            <Text style={[styles.backText, lowVision && styles.backTextLowVision]}>{displayBackLabel}</Text>
          </Pressable>
        ) : (
          <View />
        )}
        {right}
      </View>
      {displayTitle ? (
        <Text style={[styles.title, lowVision && styles.titleLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
          {displayTitle}
        </Text>
      ) : null}
      {displaySubtitle ? (
        <Text
          style={[styles.subtitle, lowVision && styles.subtitleLowVision]}
          numberOfLines={subtitleNumberOfLines}
          adjustsFontSizeToFit={Boolean(subtitleNumberOfLines)}
          minimumFontScale={0.82}>
          {displaySubtitle}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  const { lowVision } = useUserMode();
  const { tx } = useI18n();
  return (
    <View style={[styles.sectionHeader, lowVision && styles.sectionHeaderLowVision]}>
      <Text style={[styles.sectionTitle, lowVision && styles.sectionTitleLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>
        {tx(title)}
      </Text>
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
  const { lowVision } = useUserMode();
  const toneStyle = badgeTone[tone];
  const boxSize = size === 'lg' ? (lowVision ? 62 : 58) : size === 'sm' ? (lowVision ? 42 : 38) : lowVision ? 52 : 48;
  const iconSize = size === 'lg' ? (lowVision ? 29 : 27) : size === 'sm' ? (lowVision ? 20 : 18) : lowVision ? 25 : 23;
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
  const { lowVision } = useUserMode();
  const { tx } = useI18n();
  const displayTitle = tx(title);
  const displaySubtitle = subtitle ? tx(subtitle) : subtitle;
  return (
    <Pressable
      style={({ pressed }) => [styles.card, lowVision && styles.cardLowVision, pressed && onPress ? styles.pressed : null]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={displaySubtitle ? `${displayTitle}. ${displaySubtitle}` : displayTitle}>
      <IconBadge icon={icon} tone={tone} />
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, lowVision && styles.cardTitleLowVision]} numberOfLines={lowVision ? 2 : 1}>
          {displayTitle}
        </Text>
        {displaySubtitle ? (
          <Text style={[styles.cardSubtitle, lowVision && styles.cardSubtitleLowVision]} numberOfLines={2}>
            {displaySubtitle}
          </Text>
        ) : null}
        {meta}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={lowVision ? 22 : 19} color={Palette.textSubtle} /> : null}
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
  const { lowVision } = useUserMode();
  const { tx } = useI18n();
  const displayLabel = tx(label);
  const variantStyle =
    variant === 'secondary' ? styles.secondaryButton : variant === 'danger' ? styles.dangerButton : styles.primaryButton;
  const textStyle =
    variant === 'secondary' ? styles.secondaryButtonText : variant === 'danger' ? styles.dangerButtonText : styles.primaryButtonText;
  const iconColor = variant === 'secondary' ? Palette.primary : variant === 'danger' ? Palette.rose : '#FFFFFF';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        lowVision && styles.buttonLowVision,
        variantStyle,
        disabled && styles.buttonDisabled,
        pressed && !disabled ? styles.pressed : null,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}>
      {icon ? <Ionicons name={icon} size={lowVision ? 23 : 19} color={iconColor} /> : null}
      <Text style={[textStyle, lowVision && styles.buttonTextLowVision]} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.68}>
        {displayLabel}
      </Text>
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
  topBarLowVision: {
    paddingBottom: 16,
  },
  navRow: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navRowLowVision: {
    minHeight: 42,
    marginBottom: 8,
  },
  backButton: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -6,
  },
  backButtonLowVision: {
    minHeight: 42,
  },
  backText: {
    color: Palette.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  backTextLowVision: {
    fontSize: 18,
    fontWeight: '700',
  },
  title: {
    ...Typography.title,
    color: Palette.text,
  },
  titleLowVision: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.body,
    color: Palette.textMuted,
    marginTop: 8,
  },
  subtitleLowVision: {
    fontSize: 18,
    lineHeight: 26,
    marginTop: 6,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.screen,
    marginTop: 2,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionHeaderLowVision: {
    marginBottom: 10,
  },
  sectionTitle: {
    ...Typography.section,
    flex: 1,
    minWidth: 0,
    color: Palette.text,
  },
  sectionTitleLowVision: {
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '600',
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
  cardLowVision: {
    minHeight: 104,
    padding: 17,
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
    fontWeight: '600',
    color: Palette.text,
  },
  cardTitleLowVision: {
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '500',
    color: Palette.textMuted,
    marginTop: 3,
  },
  cardSubtitleLowVision: {
    fontSize: 17,
    lineHeight: 24,
  },
  button: {
    minHeight: 62,
    borderRadius: Radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  buttonLowVision: {
    minHeight: 72,
    borderRadius: Radius.lg,
    gap: 10,
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
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: Palette.primary,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  dangerButtonText: {
    color: Palette.rose,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonTextLowVision: {
    fontSize: 19,
    lineHeight: 24,
  },
  buttonDisabled: {
    opacity: 0.42,
  },
});
