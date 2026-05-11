import { useEffect, useState } from 'react';
import {
  Image,
  type ImageProps,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

type ImageWithFallbackProps = {
  accessibilityLabel: string;
  fallbackSource: ImageSourcePropType;
  resizeMode?: ImageProps['resizeMode'];
  style?: StyleProp<ImageStyle>;
  uri?: string | null;
};

export function ImageWithFallback({
  accessibilityLabel,
  fallbackSource,
  resizeMode = 'cover',
  style,
  uri,
}: ImageWithFallbackProps) {
  const normalizedUri = typeof uri === 'string' && uri.trim().length > 0 ? uri.trim() : null;
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    setHasLoadError(false);
  }, [normalizedUri]);

  const source = normalizedUri && !hasLoadError
    ? { uri: normalizedUri }
    : fallbackSource;

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      onError={normalizedUri && !hasLoadError ? () => setHasLoadError(true) : undefined}
      resizeMode={resizeMode}
      source={source}
      style={style}
    />
  );
}