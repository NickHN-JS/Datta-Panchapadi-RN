import './global.css';
import { useFonts } from 'expo-font';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Martel_400Regular, Martel_700Bold, Martel_900Black } from '@expo-google-fonts/martel';
import { YatraOne_400Regular } from '@expo-google-fonts/yatra-one';
import { Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { View, ActivityIndicator, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReaderProvider, useReader } from './src/context/ReaderContext';
import { themeVars } from './src/theme/tokens';

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator />
    </View>
  );
}

function Root() {
  const { isReady, theme } = useReader();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <View style={themeVars[theme]} className="flex-1 items-center justify-center bg-background">
      <StatusBar style="auto" />
      <Text className="font-serif text-on-background">
        Milestone 0 complete — foundation is wired up.
      </Text>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Martel_400Regular,
    Martel_700Bold,
    Martel_900Black,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_700Bold,
    Cinzel_700Bold,
    YatraOne_400Regular,
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ReaderProvider>
          <Root />
        </ReaderProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
