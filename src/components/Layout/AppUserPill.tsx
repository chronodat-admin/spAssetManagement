import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import { UserAvatar } from '../PeoplePicker/UserAvatar';

const useStyles = makeStyles({
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '34px',
    padding: 0,
    borderRadius: tokens.borderRadiusCircular,
    border: '1px solid color-mix(in srgb, var(--asset-topnav-text, #ffffff) 55%, transparent)',
    backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 10%, transparent)',
    cursor: 'pointer',
    textDecoration: 'none',
    flexShrink: 0,
    boxSizing: 'border-box',
    ':hover': {
      backgroundColor: 'color-mix(in srgb, var(--asset-topnav-text, #ffffff) 18%, transparent)',
      border: '1px solid color-mix(in srgb, var(--asset-topnav-text, #ffffff) 85%, transparent)'
    },
    ':focus-visible': {
      outline: `2px solid var(--asset-topnav-text, #ffffff)`,
      outlineOffset: '2px'
    }
  }
});

export interface IAppUserPillProps {
  displayName: string;
  email?: string;
  loginName?: string;
  profileUrl?: string;
}

export const AppUserPill: React.FC<IAppUserPillProps> = ({
  displayName,
  email,
  loginName,
  profileUrl
}) => {
  const styles = useStyles();
  const label = displayName.trim() || 'Current user';

  const content = (
    <UserAvatar name={label} email={email} loginName={loginName} size={28} />
  );

  if (profileUrl) {
    return (
      <a
        className={styles.pill}
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${label} profile`}
        title={label}
      >
        {content}
      </a>
    );
  }

  return (
    <span className={styles.pill} aria-label={label} title={label} role="img">
      {content}
    </span>
  );
};
