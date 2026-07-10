import * as React from 'react';

import { makeStyles, mergeClasses } from '@fluentui/react-components';

import {
  ASSET_MANAGEMENT_BRAND_ICON_URL,
  ASSET_MANAGEMENT_NAV_ICON_URL
} from '../../constants/brandAssets';

const useStyles = makeStyles({
  root: {
    display: 'block',
    flexShrink: 0,
    objectFit: 'contain',
    backgroundColor: 'transparent'
  },
  nav: {
    width: '28px',
    height: '28px'
  },
  inline: {
    width: '24px',
    height: '24px'
  },
  title: {
    width: '28px',
    height: '28px'
  },
  tile: {
    width: '96px',
    height: '96px',
    borderRadius: '12px'
  }
});

export type AppBrandIconVariant = 'nav' | 'inline' | 'title' | 'tile';

export interface AppBrandIconProps {
  variant?: AppBrandIconVariant;
  className?: string;
  decorative?: boolean;
}

export const AppBrandIcon: React.FC<AppBrandIconProps> = ({
  variant = 'nav',
  className,
  decorative = true
}) => {
  const styles = useStyles();
  const src = variant === 'tile' ? ASSET_MANAGEMENT_BRAND_ICON_URL : ASSET_MANAGEMENT_NAV_ICON_URL;

  return (
    <img
      src={src}
      alt={decorative ? '' : 'Asset Management'}
      className={mergeClasses(styles.root, styles[variant], className)}
      aria-hidden={decorative || undefined}
    />
  );
};
