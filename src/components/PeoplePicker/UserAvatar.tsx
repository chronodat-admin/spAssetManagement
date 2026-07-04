import * as React from 'react';
import { Avatar, tokens } from '@fluentui/react-components';
import { accountNameFromLoginName, getUserPhotoUrl, UserPhotoSize } from '../../utils/userPhoto';

export interface IUserAvatarProps {
  /** Display name; used for initials fallback and accessibility. */
  name?: string;
  /** User email/UPN used to resolve the profile photo. */
  email?: string;
  /** Claims login name (e.g. i:0#.f|membership|user@contoso.com) as a fallback source of the email. */
  loginName?: string;
  /** Render as a group icon instead of a person photo. */
  isGroup?: boolean;
  /** Avatar pixel size (Fluent supports 16–128). */
  size?: 16 | 20 | 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 72 | 96 | 120 | 128;
  photoSize?: UserPhotoSize;
}

const SIZE_TO_PHOTO: Record<number, UserPhotoSize> = {
  16: 'S',
  20: 'S',
  24: 'S',
  28: 'S',
  32: 'M',
  36: 'M',
  40: 'M',
  48: 'M'
};

export const UserAvatar: React.FC<IUserAvatarProps> = ({
  name,
  email,
  loginName,
  isGroup,
  size = 24,
  photoSize
}) => {
  const accountName = email || accountNameFromLoginName(loginName);
  const resolvedPhotoSize = photoSize || SIZE_TO_PHOTO[size] || 'M';
  const photoUrl = isGroup ? undefined : getUserPhotoUrl(accountName, resolvedPhotoSize);
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [photoUrl]);

  const showImage = !!photoUrl && !imageFailed;

  return (
    <Avatar
      name={name}
      size={size}
      image={
        showImage
          ? { src: photoUrl, onError: () => setImageFailed(true) }
          : undefined
      }
      color={isGroup ? 'neutral' : 'colorful'}
      shape={isGroup ? 'square' : 'circular'}
      aria-label={name}
    />
  );
};

export interface IUserCellProps {
  name?: string;
  email?: string;
  loginName?: string;
  isGroup?: boolean;
  /** Text shown when there is no user (defaults to an em dash). */
  emptyText?: string;
}

/** Compact avatar + name cell for displaying a single user value in lists/tables. */
export const UserCell: React.FC<IUserCellProps> = ({
  name,
  email,
  loginName,
  isGroup,
  emptyText = '—'
}) => {
  if (!name) {
    return <span>{emptyText}</span>;
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        minWidth: 0,
        maxWidth: '100%'
      }}
    >
      <UserAvatar name={name} email={email} loginName={loginName} isGroup={isGroup} size={24} />
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {name}
      </span>
    </span>
  );
};
