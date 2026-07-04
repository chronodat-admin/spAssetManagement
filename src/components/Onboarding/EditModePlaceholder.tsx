import * as React from 'react';
import {
  Card,
  makeStyles,
  shorthands,
  Text,
  Title3,
  tokens
} from '@fluentui/react-components';
import { PuzzlePieceRegular } from '@fluentui/react-icons';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { DedicatedSubsiteWarning } from './DedicatedSubsiteWarning';

const useStyles = makeStyles({
  root: {
    position: 'relative',
    minHeight: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusLarge,
    border: `1px dashed ${tokens.colorNeutralStroke2}`
  },
  panel: {
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow4,
    maxWidth: '520px',
    width: '100%',
    padding: tokens.spacingHorizontalL
  },
  list: {
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    lineHeight: 1.8,
    paddingLeft: tokens.spacingHorizontalL
  }
});

export interface IEditModePlaceholderProps {
  isTeamsHost?: boolean;
}

export const EditModePlaceholder: React.FC<IEditModePlaceholderProps> = ({ isTeamsHost = false }) => {
  const styles = useStyles();

  return (
    <div className={styles.root} style={{ minHeight: 320, width: '100%' }}>
      <Card className={styles.panel}>
        <Title3 as="h2">
          <PuzzlePieceRegular /> {DEFAULT_APP_TITLE}
        </Title3>
        <Text style={{ color: tokens.colorNeutralForeground3, lineHeight: 1.6 }}>
          This web part is ready. Publish the page to start the one-time setup wizard that creates
          your SharePoint lists and default risk and compliance data.
        </Text>
        <DedicatedSubsiteWarning isTeamsHost={isTeamsHost} />
        <ol className={styles.list}>
          <li>Finish editing the page layout</li>
          <li>
            Click <strong>Publish</strong> (or Republish)
          </li>
          <li>Return to this page — setup will begin automatically</li>
        </ol>
        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
          Setup does not run while the page is in edit mode.
        </Text>
      </Card>
    </div>
  );
};
