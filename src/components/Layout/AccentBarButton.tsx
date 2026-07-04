import * as React from 'react';
import {
  Button,
  ButtonProps,
  makeStyles,
  mergeClasses,
  tokens
} from '@fluentui/react-components';

const useStyles = makeStyles({
  base: {
    boxShadow: 'none',
    minHeight: '34px',
    fontWeight: tokens.fontWeightSemibold
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--asset-topnav-text, #ffffff)',
    border: '1px solid color-mix(in srgb, var(--asset-topnav-text, #ffffff) 60%, transparent)',
    '& svg': {
      fill: 'currentColor'
    },
    ':hover': {
      backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 12%, transparent)',
      color: 'var(--asset-topnav-text, #ffffff)',
      border: '1px solid color-mix(in srgb, var(--asset-topnav-text, #ffffff) 85%, transparent)'
    },
    ':hover:active': {
      backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 18%, transparent)',
      color: 'var(--asset-topnav-text, #ffffff)'
    }
  },
  ghostActive: {
    backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 22%, transparent)',
    color: 'var(--asset-topnav-text, #ffffff)',
    border: '1px solid color-mix(in srgb, var(--asset-topnav-text, #ffffff) 95%, transparent)',
    '& svg': {
      fill: 'currentColor'
    },
    ':hover': {
      backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 30%, transparent)',
      color: 'var(--asset-topnav-text, #ffffff)'
    }
  },
  solid: {
    backgroundColor: 'var(--asset-topnav-cta-bg, #fbbf24)',
    color: 'var(--asset-topnav-cta-text, #0f172a)',
    border: '1px solid var(--asset-topnav-cta-border, #d97706)',
    boxShadow: 'var(--asset-topnav-cta-shadow, 0 2px 8px rgba(15, 23, 42, 0.28))',
    '& svg': {
      fill: 'currentColor'
    },
    ':hover': {
      backgroundColor: 'var(--asset-topnav-cta-bg-hover, #f59e0b)',
      color: 'var(--asset-topnav-cta-text, #0f172a)',
      border: '1px solid var(--asset-topnav-cta-border, #d97706)',
      boxShadow: 'var(--asset-topnav-cta-shadow, 0 2px 8px rgba(15, 23, 42, 0.28))'
    },
    ':hover:active': {
      backgroundColor: 'var(--asset-topnav-cta-bg-hover, #f59e0b)',
      color: 'var(--asset-topnav-cta-text, #0f172a)'
    },
    ':disabled': {
      backgroundColor: 'var(--asset-topnav-cta-bg, #fbbf24)',
      color: 'var(--asset-topnav-cta-text, #0f172a)',
      opacity: 0.55
    }
  }
});

export type AccentBarButtonVariant = 'ghost' | 'ghost-active' | 'solid';

export type AccentBarButtonProps = ButtonProps & {
  variant?: AccentBarButtonVariant;
};

export const AccentBarButton: React.FC<AccentBarButtonProps> = ({
  variant = 'ghost',
  className,
  appearance = 'transparent',
  ...props
}) => {
  const styles = useStyles();

  return (
    <Button
      {...props}
      appearance={appearance}
      className={mergeClasses(
        styles.base,
        variant === 'ghost' && styles.ghost,
        variant === 'ghost-active' && styles.ghostActive,
        variant === 'solid' && styles.solid,
        className
      )}
    />
  );
};
