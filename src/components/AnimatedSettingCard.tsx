import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {sharedStyles} from '../styles';

type Props = {
  index: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedSettingCard({index, children, style}: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay: index * 55,
      tension: 120,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [index, progress]);

  return (
    <Animated.View
      style={[
        sharedStyles.card,
        styles.card,
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [12, 0],
              }),
            },
            {
              scale: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0.98, 1],
              }),
            },
          ],
        },
      ]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
