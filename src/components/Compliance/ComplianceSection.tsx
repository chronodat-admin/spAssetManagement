import * as React from 'react';
import { ComplianceService } from '../../services/ComplianceService';
import { ComplianceAssessmentDetail } from './ComplianceAssessmentDetail';
import { ComplianceFrameworkDetail } from './ComplianceFrameworkDetail';
import { ComplianceHub } from './ComplianceHub';

export type ComplianceView =
  | { type: 'hub' }
  | { type: 'framework'; frameworkId: number }
  | { type: 'assessment'; assessmentId: number };

export interface IComplianceSectionProps {
  complianceService: ComplianceService;
  initialView?: ComplianceView;
  view?: ComplianceView;
  onViewChange?: (view: ComplianceView) => void;
  openCreateAssessmentSignal?: number;
  onDataChanged?: () => void;
}

export const ComplianceSection: React.FC<IComplianceSectionProps> = ({
  complianceService,
  initialView = { type: 'hub' },
  view: controlledView,
  onViewChange,
  openCreateAssessmentSignal,
  onDataChanged
}) => {
  const [internalView, setInternalView] = React.useState<ComplianceView>(initialView);
  const view = controlledView || internalView;

  const setView = React.useCallback(
    (next: ComplianceView) => {
      if (!controlledView) {
        setInternalView(next);
      }
      onViewChange?.(next);
    },
    [controlledView, onViewChange]
  );

  React.useEffect(() => {
    if (controlledView) {
      setInternalView(controlledView);
    }
  }, [controlledView]);

  React.useEffect(() => {
    setInternalView(initialView);
  }, [initialView]);

  if (view.type === 'framework') {
    return (
      <ComplianceFrameworkDetail
        complianceService={complianceService}
        frameworkId={view.frameworkId}
        onBack={() => setView({ type: 'hub' })}
      />
    );
  }

  if (view.type === 'assessment') {
    return (
      <ComplianceAssessmentDetail
        complianceService={complianceService}
        assessmentId={view.assessmentId}
        onBack={() => setView({ type: 'hub' })}
        onDeleted={() => {
          onDataChanged?.();
          setView({ type: 'hub' });
        }}
        onDataChanged={onDataChanged}
      />
    );
  }

  return (
    <ComplianceHub
      complianceService={complianceService}
      onOpenFramework={(frameworkId) => setView({ type: 'framework', frameworkId })}
      onOpenAssessment={(assessmentId) => setView({ type: 'assessment', assessmentId })}
      openCreateAssessmentSignal={openCreateAssessmentSignal}
      onDataChanged={onDataChanged}
    />
  );
};
