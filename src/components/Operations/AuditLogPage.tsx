import * as React from 'react';
import { AuditLogTab } from '../Settings/AuditLogTab';
import { AssetService } from '../../services/AssetService';

export interface IAuditLogPageProps {
  assetService: AssetService;
}

export const AuditLogPage: React.FC<IAuditLogPageProps> = ({ assetService }) => {
  return <AuditLogTab riskService={assetService} />;
};
