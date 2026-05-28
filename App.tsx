import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Platform, StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AboutScreen} from './src/screens/AboutScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {EnhancedOnboardingScreen} from './src/screens/EnhancedOnboardingScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {SplashScreen} from './src/screens/SplashScreen';
import {EarGuardNative} from './src/native/earguard';

type Screen = 'splash' | 'onboarding' | 'home' | 'settings' | 'about';

function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [refreshToken, setRefreshToken] = useState(0);
  const [aboutParams, setAboutParams] = useState({
    interval: 30,
    sound: 'reminder3.mp3',
  });
  const transition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setScreen('home');
      return;
    }
    EarGuardNative.getOnboardingCompleted()
      .then(done => setScreen(done ? 'home' : 'onboarding'))
      .catch(() => setScreen('onboarding'));
  }, []);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [screen, transition]);

  const sceneStyle = useMemo(
    () => ({
      flex: 1,
      opacity: transition,
      transform: [
        {
          translateY: transition.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0],
          }),
        },
      ],
    }),
    [transition],
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F7FF" />
      {screen === 'splash' && (
        <SplashScreen
          onComplete={() => {
            if (Platform.OS !== 'android') {
              setScreen('home');
              return;
            }
            EarGuardNative.getOnboardingCompleted()
              .then(done => setScreen(done ? 'home' : 'onboarding'))
              .catch(() => setScreen('onboarding'));
          }}
        />
      )}
      <Animated.View style={[sceneStyle, {display: screen === 'splash' ? 'none' : 'flex'}]}>
        {screen === 'onboarding' && (
          <EnhancedOnboardingScreen
            onFinish={() => {
              setScreen('home');
              setRefreshToken(token => token + 1);
            }}
          />
        )}
        {screen === 'home' && (
          <HomeScreen
            setupCompleted
            refreshToken={refreshToken}
            onOpenSettings={() => setScreen('settings')}
            onOpenAbout={(interval, sound) => {
              setAboutParams({interval, sound});
              setScreen('about');
            }}
          />
        )}
        {screen === 'settings' && (
          <SettingsScreen
            onBack={() => setScreen('home')}
            onSettingsChanged={() => setRefreshToken(token => token + 1)}
          />
        )}
        {screen === 'about' && (
          <AboutScreen
            interval={aboutParams.interval}
            selectedSound={aboutParams.sound}
            onBack={() => setScreen('home')}
          />
        )}
      </Animated.View>
    </SafeAreaProvider>
  );
}

export default App;
