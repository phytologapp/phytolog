import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: { ...base.colors, background: c.ground, card: c.ground, text: c.text, primary: c.leaf, border: c.line },
      }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.ground } }} />
    </ThemeProvider>
  );
}
