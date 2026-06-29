import { Platform } from 'react-native';

export const Palette = {
  background: '#F6F7F9',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F6',
  surfaceWarm: '#FFF8EF',
  border: '#E5E8EC',
  borderStrong: '#D6DCE3',
  text: '#171A1F',
  textMuted: '#737B87',
  textSubtle: '#9AA2AD',
  primary: '#1677FF',
  primaryPressed: '#0E63D8',
  primarySoft: '#EAF3FF',
  mint: '#12B886',
  mintSoft: '#E7F8F1',
  rose: '#F04452',
  roseSoft: '#FFECEF',
  amber: '#F59F00',
  amberSoft: '#FFF5DC',
  blueGrey: '#334155',
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};

export const Spacing = {
  screen: 20,
  section: 28,
};

export const Shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
};

export const Typography = {
  hero: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800' as const,
    letterSpacing: 0,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800' as const,
    letterSpacing: 0,
  },
  section: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '800' as const,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: '500' as const,
    letterSpacing: 0,
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: 0,
  },
};

export const Brand = {
  primary: Palette.primary,
  primaryDark: Palette.primaryPressed,
  textDark: Palette.text,
  textMuted: Palette.textMuted,
  surface: Palette.background,
  success: Palette.mint,
};

const tintColorLight = Palette.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.background,
    tint: tintColorLight,
    icon: Palette.textMuted,
    tabIconDefault: Palette.textMuted,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
