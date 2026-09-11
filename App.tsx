import './global.css';
import { useFonts } from 'expo-font';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { Martel_400Regular, Martel_700Bold, Martel_900Black } from '@expo-google-fonts/martel';
import { YatraOne_400Regular } from '@expo-google-fonts/yatra-one';
import { Poppins_400Regular, Poppins_500Medium, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ReaderProvider, useReaderNav } from './src/context/ReaderContext';
import { ReaderLayout } from './src/components/Reader/ReaderLayout';

function LoadingScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator />
    </View>
  );
}

function Root() {
  const { isReady } = useReaderNav();

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="auto" />
      <ReaderLayout />
    </>
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
