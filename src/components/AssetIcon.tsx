import React from 'react';
import {Image, type ImageSourcePropType, type StyleProp, type ViewStyle} from 'react-native';
import {AppIcon, type AppIconName} from './AppIcon';
import {ICON_ASSET_SOURCES} from './assetIconRegistry';

/** Maps legacy LineIcon names to AppIcon / asset keys */
const NAME_MAP: Record<string, AppIconName> = {
  back: 'back',
  bell: 'bell',
  chart: 'chart',
  check: 'check',
  close: 'close',
  info: 'info',
  moon: 'moon',
  phone: 'phone',
  play: 'play',
  permissions: 'permissions',
  settings: 'settings',
  shield: 'shield',
  spark: 'spark',
  sound: 'sound',
  timer: 'timer',
  warning: 'warning',
  alert: 'warning',
  vibrate: 'vibrate',
  stop: 'close',
};

export type AssetIconName = keyof typeof NAME_MAP | AppIconName;

type Props = {
  name: AssetIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

function resolveAppIconName(name: AssetIconName): AppIconName {
  return (NAME_MAP[name as string] ?? name) as AppIconName;
}

function resolveAssetSource(name: AssetIconName): ImageSourcePropType | undefined {
  const key = resolveAppIconName(name);
  return ICON_ASSET_SOURCES[key];
}

export function AssetIcon({name, size = 20, color, style}: Props) {
  const source = resolveAssetSource(name);
  const appName = resolveAppIconName(name);

  if (source) {
    return (
      <Image
        source={source}
        style={[{width: size, height: size, tintColor: color}, style]}
        resizeMode="contain"
      />
    );
  }

  return <AppIcon name={appName} size={size} color={color} />;
}
