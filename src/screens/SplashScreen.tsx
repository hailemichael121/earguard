import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Image, StyleSheet, Text, View} from 'react-native';
import {COLORS} from '../constants';
import {MagicBackground} from '../components/MagicBackground';
import {LineIcon} from '../components/LineIcon';

type Props = {
  onComplete: () => void;
  duration?: number;
};

export function SplashScreen({onComplete, duration = 2600}: Props) {
  const iconScale = useRef(new Animated.Value(0.72)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(14)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 11,
        bounciness: 8,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(contentY, {
            toValue: 0,
            duration: 280,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    entrance.start();

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulseLoop.start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(contentOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(iconOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 0.94,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => onComplete());
    }, duration);

    return () => {
      clearTimeout(timer);
      pulseLoop.stop();
    };
  }, [contentOpacity, contentY, duration, iconOpacity, iconScale, onComplete, pulse]);

  return (
    <View style={styles.screen}>
      <MagicBackground />

      <View style={styles.orbits}>
        <Animated.View
          style={[
            styles.orbit,
            styles.orbitOne,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.25, 0.46],
              }),
            },
          ]}
        />
        <Animated.View
          style={[
            styles.orbit,
            styles.orbitTwo,
            {
              opacity: pulse.interpolate({
                inputRange: [0, 1],
                outputRange: [0.12, 0.28],
              }),
            },
          ]}
        />
      </View>

      <Animated.View
        style={[
          styles.hero,
          {
            opacity: iconOpacity,
            transform: [{scale: iconScale}],
          },
        ]}>
        <View style={styles.iconFrame}>
          <Image
            source={require('../../assets/icons/app-icon.png')}
            style={styles.icon}
          />
        </View>

        <Animated.View
          style={[
            styles.copy,
            {
              opacity: contentOpacity,
              transform: [{translateY: contentY}],
            },
          ]}>
          <Text style={styles.title}>EarGuard</Text>
          <Text style={styles.subtitle}>
            Gentle call reminders, clear guidance, and no visual clutter.
          </Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <LineIcon name="phone" size={14} color={COLORS.primary} />
              <Text style={styles.badgeText}>Call-aware</Text>
            </View>
            <View style={styles.badge}>
              <LineIcon name="moon" size={14} color={COLORS.accent} />
              <Text style={styles.badgeText}>Quiet-friendly</Text>
            </View>
          </View>

          <View style={styles.loadingTrack}>
            <Animated.View
              style={[
                styles.loadingFill,
                {
                  transform: [
                    {
                      scaleX: pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.55, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
          <Text style={styles.loadingText}>Preparing your workspace</Text>
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
    padding: 24,
  },
  orbits: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.14)',
    borderStyle: 'solid',
  },
  orbitOne: {
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  orbitTwo: {
    width: 360,
    height: 360,
    borderRadius: 180,
  },
  hero: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  iconFrame: {
    width: 132,
    height: 132,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(216,225,238,0.86)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.shadowDark,
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 5,
  },
  icon: {
    width: 102,
    height: 102,
    borderRadius: 28,
  },
  copy: {
    marginTop: 28,
    alignItems: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 10,
    color: COLORS.textSoft,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  loadingTrack: {
    marginTop: 28,
    width: 180,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(148,163,184,0.18)',
    overflow: 'hidden',
  },
  loadingFill: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSoft,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
