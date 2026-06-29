import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

// 💡 애플 건강 앱 스타일의 기본 배경색 지정
const APPLE_BG = '#F2F2F7';

// 💡 화면 전환 시 검은 화면이나 흰 화면이 번쩍이지 않도록 네비게이션 기본 배경을 통일합니다.
const AppleCustomTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: APPLE_BG,
  },
};

// 앱 렌더링이 준비되기 전까지 스플래쉬 화면이 자동으로 숨겨지는 것을 방지합니다.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  // 앱 초기 로딩을 처리하는 useEffect
  useEffect(() => {
    async function prepare() {
      try {
        // 이곳에 폰트 로딩, 사용자 인증 상태 확인, 로컬 DB 초기화 등의 작업을 넣으세요.
        
        // 시각적 확인을 위한 2초 딜레이 (실제 배포 시에는 이 setTimeout을 지우시면 됩니다)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (e) {
        console.warn(e);
      } finally {
        // 모든 준비가 끝나면 스플래쉬 화면을 숨겨 메인 화면(index)을 띄웁니다.
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <ThemeProvider value={AppleCustomTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="select" options={{ headerShown: false }} />
        <Stack.Screen name="history" options={{ headerShown: false }} />
        <Stack.Screen name="record" options={{ headerShown: false }} />
        <Stack.Screen
          name="camera"
          options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="result" options={{ headerShown: false }} />
        <Stack.Screen
          name="analyze"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="analysis" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen
          name="analysis-failed"
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack>
      
      {/* 💡 앱 전체의 상단 상태표시줄 텍스트(시간, 배터리)를 어두운 색으로 고정하여 쿨 그레이 배경에서 잘 보이게 합니다. */}
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}