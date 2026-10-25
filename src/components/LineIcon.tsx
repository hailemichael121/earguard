import React from 'react';
import {type StyleProp, type ViewStyle} from 'react-native';
import {COLORS} from '../constants';
import {AssetIcon, type AssetIconName} from './AssetIcon';

export type LineIconName =
  | 'back'
  | 'bell'
  | 'chart'
  | 'check'
  | 'close'
  | 'info'
  | 'moon'
  | 'phone'
  | 'play'
  | 'permissions'
  | 'settings'
  | 'shield'
  | 'spark'
  | 'sound'
  | 'timer'
  | 'warning'
  | 'alert'
  | 'vibrate'
  | 'stop';

type Props = {
  name: LineIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function LineIcon({name, size = 18, color = COLORS.text, style}: Props) {
  return <AssetIcon name={name as AssetIconName} size={size} color={color} style={style} />;
}
