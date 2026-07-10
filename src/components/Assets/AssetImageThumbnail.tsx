import * as React from 'react';
import { ImageRegular } from '@fluentui/react-icons';
import { makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { resolveAssetImageUrl } from '../../utils/assetImage';

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    flexShrink: 0
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  placeholder: {
    color: tokens.colorNeutralForeground4
  },
  large: {
    width: '160px',
    height: '160px'
  },
  medium: {
    width: '96px',
    height: '96px'
  },
  small: {
    width: '40px',
    height: '40px'
  }
});

export interface IAssetImageThumbnailProps {
  imageUrl?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large';
  webOrigin?: string;
  className?: string;
}

export const AssetImageThumbnail: React.FC<IAssetImageThumbnailProps> = ({
  imageUrl,
  alt = 'Asset image',
  size = 'small',
  webOrigin,
  className
}) => {
  const styles = useStyles();
  const resolvedUrl = resolveAssetImageUrl(imageUrl, webOrigin);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    setFailed(false);
  }, [resolvedUrl]);

  const sizeClass =
    size === 'large' ? styles.large : size === 'medium' ? styles.medium : styles.small;
  const iconSize = size === 'large' ? 40 : size === 'medium' ? 28 : 18;

  return (
    <span className={mergeClasses(styles.root, sizeClass, className)} aria-hidden={!resolvedUrl || failed}>
      {resolvedUrl && !failed ? (
        <img
          src={resolvedUrl}
          alt={alt}
          className={styles.image}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageRegular className={styles.placeholder} fontSize={iconSize} />
      )}
    </span>
  );
};
