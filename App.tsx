import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  BackHandler,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {COLORS} from './src/constants';
import {AboutScreen} from './src/screens/AboutScreen';
import {CallsScreen} from './src/screens/CallsScreen';
import {HomeScreen} from './src/screens/HomeScreen';
import {EnhancedOnboardingScreen} from './src/screens/EnhancedOnboardingScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {SplashScreen} from './src/screens/SplashScreen';
import {TestingScreen} from './src/screens/TestingScreen';
import {EarGuardNative} from './src/native/earguard';
import {LineIcon, type LineIconName} from './src/components/LineIcon';
import {FloatingCallerIdCard} from './src/components/FloatingCallerIdCard';
import {PostCallSummaryCard} from './src/components/PostCallSummaryCard';
import {useEarGuardCallSession} from './src/hooks/useEarGuardCallSession';

type Screen = 'splash' | 'onboarding' | 'home' | 'settings' | 'about' | 'calls' | 'testing';
type ToastTone = 'info' | 'success' | 'warning' | 'error';

type ToastState = {
  id: number;
  message: string;
  icon: LineIconName;
  tone: ToastTone;
};

function AppContent() {
  const insets = useSafeAreaInsets();
  const [stack, setStack] = useState<Screen[]>(['splash']);
  const [refreshToken, setRefreshToken] = useState(0);
  const [aboutParams, setAboutParams] = useState({
    interval: 30,
    sound: 'reminder3.mp3',
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transition = useRef(new Animated.Value(0)).current;
  const lastBackPress = useRef(0);

  const screen = stack[stack.length - 1];
  const monitoringEnabled = screen !== 'splash' && screen !== 'onboarding';
  const callSession = useEarGuardCallSession({
    enabled: monitoringEnabled && Platform.OS === 'android',
    refreshToken,
  });

  useEffect(() => {
    if (Platform.OS !== 'android') {
      setStack(['home']);
      return;
    }
    EarGuardNative.getOnboardingCompleted()
      .then(done => setStack([done ? 'home' : 'onboarding']))
      .catch(() => setStack(['onboarding']));
  }, []);

  useEffect(() => {
    transition.setValue(0);
    Animated.timing(transition, {
      toValue: 1,
      duration: 260,
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

  const showToast = useCallback(
    (next: Omit<ToastState, 'id'>) => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }

      setToast(previous => ({
        id: (previous?.id ?? 0) + 1,
        ...next,
      }));

      toastAnim.setValue(0);
      Animated.spring(toastAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }).start();

      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, {
          toValue: 0,
          duration: 160,
          useNativeDriver: true,
        }).start(() => {
          toastTimer.current = null;
          setToast(null);
        });
      }, 2200);
    },
    [toastAnim],
  );

  useEffect(
    () => () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    },
    [],
  );

  const pushScreen = useCallback((next: Screen) => {
    setStack(previous => [...previous, next]);
  }, []);

  const replaceStack = useCallback((next: Screen) => {
    setStack([next]);
  }, []);

  const goBack = useCallback(() => {
    setStack(previous => (previous.length > 1 ? previous.slice(0, -1) : previous));
  }, []);

  const resetBackTimer = useCallback(() => {
    lastBackPress.current = 0;
  }, []);

  useEffect(() => {
    if (screen !== 'home') {
      resetBackTimer();
    }
  }, [screen, resetBackTimer]);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (screen === 'home' && stack.length === 1) {
        const now = Date.now();
        if (now - lastBackPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPress.current = now;
        showToast({
          message: 'Press back again to exit',
          icon: 'warning',
          tone: 'warning',
        });
        return true;
      }

      if (stack.length > 1) {
        setStack(previous => previous.slice(0, -1));
        return true;
      }

      return true;
    });

    return () => subscription.remove();
  }, [screen, showToast, stack.length]);

  const statusBarStyle = Platform.OS === 'ios' ? 'dark-content' : 'dark-content';

  const handleToastClose = useCallback(() => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    Animated.timing(toastAnim, {
      toValue: 0,
      duration: 140,
      useNativeDriver: true,
    }).start(() => {
      toastTimer.current = null;
      setToast(null);
    });
  }, [toastAnim]);

  const toastToneStyles = {
    info: {backgroundColor: 'rgba(37,99,235,0.96)', borderColor: 'rgba(255,255,255,0.14)'},
    success: {backgroundColor: 'rgba(21,128,61,0.96)', borderColor: 'rgba(255,255,255,0.14)'},
    warning: {backgroundColor: 'rgba(217,119,6,0.96)', borderColor: 'rgba(255,255,255,0.14)'},
    error: {backgroundColor: 'rgba(190,18,60,0.96)', borderColor: 'rgba(255,255,255,0.14)'},
  }[toast?.tone ?? 'info'];

  return (
    <>
      <StatusBar barStyle={statusBarStyle} backgroundColor={COLORS.background} />

      {screen === 'splash' && (
        <SplashScreen
          onComplete={() => {
            if (Platform.OS !== 'android') {
              replaceStack('home');
              return;
            }
            EarGuardNative.getOnboardingCompleted()
              .then(done => replaceStack(done ? 'home' : 'onboarding'))
              .catch(() => replaceStack('onboarding'));
          }}
        />
      )}

      <Animated.View
        key={screen}
        style={[sceneStyle, screen === 'splash' && styles.hiddenScene]}>
        {screen === 'onboarding' && (
          <EnhancedOnboardingScreen
            onFinish={() => {
              replaceStack('home');
              setRefreshToken(token => token + 1);
              showToast({
                message: 'Setup complete',
                icon: 'check',
                tone: 'success',
              });
            }}
          />
        )}

        {screen === 'home' && (
          <HomeScreen
            setupCompleted
            refreshToken={refreshToken}
            isInCall={callSession.isInCall}
            statusMessage={callSession.statusMessage}
            callerName={callSession.callerName}
            intervalMinutes={callSession.intervalMinutes}
            onOpenSettings={() => pushScreen('settings')}
            onOpenCalls={() => pushScreen('calls')}
            onOpenAbout={(interval, sound) => {
              setAboutParams({interval, sound});
              pushScreen('about');
            }}
          />
        )}

        {screen === 'settings' && (
          <SettingsScreen
            onBack={goBack}
            onSettingsChanged={() => setRefreshToken(token => token + 1)}
            onNotify={showToast}
            onOpenTests={() => pushScreen('testing')}
          />
        )}

        {screen === 'testing' && (
          <TestingScreen
            onBack={goBack}
            onNotify={showToast}
          />
        )}

        {screen === 'about' && (
          <AboutScreen
            interval={aboutParams.interval}
            selectedSound={aboutParams.sound}
            onBack={goBack}
          />
        )}

        {screen === 'calls' && <CallsScreen onBack={goBack} />}
      </Animated.View>

      {monitoringEnabled && Platform.OS === 'android' ? (
        <>
          <FloatingCallerIdCard
            visible={callSession.showCallerCard}
            callerName={callSession.callerName}
            callerNumber={callSession.callerNumber}
            intervalMinutes={callSession.intervalMinutes}
          />
          <PostCallSummaryCard
            visible={callSession.showPostCallSummary}
            callerName={callSession.postCallCallerName}
            durationSeconds={callSession.postCallDurationSeconds}
            earSwitchCount={callSession.postCallEarSwitchCount}
            onDismiss={callSession.dismissPostCallSummary}
          />
        </>
      ) : null}

      {toast ? (
        <View pointerEvents="box-none" style={[styles.toastHost, {paddingTop: insets.top + 10}]}>
          <Animated.View
            style={[
              styles.toast,
              toastToneStyles,
              {
                opacity: toastAnim,
                transform: [
                  {
                    translateY: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-12, 0],
                    }),
                  },
                  {
                    scale: toastAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.96, 1],
                    }),
                  },
                ],
              },
            ]}>
            <View style={styles.toastIcon}>
              <LineIcon
                name={toast.icon}
                size={16}
                color={COLORS.white}
              />
            </View>
            <Text style={styles.toastText}>{toast.message}</Text>
            <Pressable onPress={handleToastClose} hitSlop={10} style={styles.toastClose}>
              <LineIcon name="close" size={14} color={COLORS.white} />
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  hiddenScene: {
    display: 'none',
  } as const,
  toastHost: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    zIndex: 50,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: COLORS.shadowDark,
    shadowOpacity: 0.18,
    shadowOffset: {width: 0, height: 10},
    shadowRadius: 18,
    elevation: 6,
  },
  toastIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  toastText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
  },
  toastClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});
