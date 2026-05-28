import React, {useEffect, useRef} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  Dimensions,
  Image,
} from 'react-native';
import {COLORS} from '../constants';
import {MagicBackground} from '../components/MagicBackground';

const {width, height} = Dimensions.get('window');

type Props = {
  onComplete: () => void;
  duration?: number;
};

export function SplashScreen({onComplete, duration = 3500}: Props) {
  const iconScale = useRef(new Animated.Value(0)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const shadowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(0)).current;
  const containerScale = useRef(new Animated.Value(1)).current;

  const displayedText = useRef('').current;
  const [displayedChars, setDisplayedChars] = React.useState('');
  const textIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fullText = 'EarGuard';
  const charsPerSecond = fullText.length / 0.8; // Spread out over 0.8s

  useEffect(() => {
    // Icon bounce-in animation (0-600ms)
    Animated.sequence([
      Animated.parallel([
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Shadow fade-in (600-1000ms)
      Animated.timing(shadowOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Text fade-in (1000-1200ms)
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Start typing effect (1200ms)
    setTimeout(() => {
      let charIndex = 0;
      textIntervalRef.current = setInterval(() => {
        if (charIndex < fullText.length) {
          setDisplayedChars(fullText.slice(0, charIndex + 1));
          charIndex++;
        } else {
          if (textIntervalRef.current) {
            clearInterval(textIntervalRef.current);
          }
          // Start cursor blink after typing completes
          Animated.loop(
            Animated.sequence([
              Animated.timing(cursorOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.timing(cursorOpacity, {
                toValue: 0.3,
                duration: 500,
                useNativeDriver: true,
              }),
            ]),
          ).start();
        }
      }, 1000 / charsPerSecond);
    }, 1200);

    // End splash screen and trigger exit animation
    const timer = setTimeout(() => {
      Animated.sequence([
        Animated.timing(containerScale, {
          toValue: 0.9,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(iconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(textOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        onComplete();
      });
    }, duration);

    return () => {
      clearTimeout(timer);
      if (textIntervalRef.current) {
        clearInterval(textIntervalRef.current);
      }
    };
  }, [iconScale, iconOpacity, shadowOpacity, textOpacity, cursorOpacity, containerScale, onComplete, duration]);

  return (
    <View style={styles.screen}>
      <MagicBackground />
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{scale: containerScale}],
          },
        ]}
      >
        {/* Icon with shadow */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.shadowLayer,
              {
                opacity: shadowOpacity,
              },
            ]}
          />
          <Animated.Image
            source={require('../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png')}
            style={[
              styles.icon,
              {
                opacity: iconOpacity,
                transform: [{scale: iconScale}],
              },
            ]}
          />
        </View>

        {/* Text with typed animation */}
        <Animated.View style={[styles.textContainer, {opacity: textOpacity}]}>
          <Text style={styles.appName}>
            {displayedChars}
            <Animated.Text style={[styles.cursor, {opacity: cursorOpacity}]}>
              |
            </Animated.Text>
          </Text>
          <Text style={styles.tagline}>Protect your hearing</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  icon: {
    width: 120,
    height: 120,
    borderRadius: 30,
  },
  shadowLayer: {
    position: 'absolute',
    bottom: -20,
    left: '50%',
    marginLeft: -45,
    width: 90,
    height: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 50,
    opacity: 0.2,
  },
  textContainer: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1.5,
    fontFamily: 'System',
  },
  cursor: {
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 2,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.muted,
    marginTop: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
