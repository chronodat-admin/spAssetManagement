import type { RiskControlLinkType } from '../models/IRiskControlLink';

/**
 * Sample risk ↔ control links seeded alongside compliance frameworks so the demo
 * shows real coverage. Resolved at seed time: `riskTitle` against the Risks list,
 * `frameworkCode`+`controlCode` against the built-in ComplianceControls.
 */
export interface IRiskControlLinkSeed {
  riskTitle: string;
  frameworkCode: string;
  controlCode: string;
  linkType: RiskControlLinkType;
  rationale: string;
}

export const RISK_CONTROL_LINK_SEED_DATA: IRiskControlLinkSeed[] = [
  {
    riskTitle: 'Third-party vendor data breach',
    frameworkCode: 'SOC2',
    controlCode: 'CC9',
    linkType: 'Mitigates',
    rationale: 'Vendor risk mitigation activities reduce likelihood of a third-party breach.'
  },
  {
    riskTitle: 'Third-party vendor data breach',
    frameworkCode: 'ISO27001',
    controlCode: 'A.15',
    linkType: 'Mitigates',
    rationale: 'Supplier relationship controls govern third-party data handling.'
  },
  {
    riskTitle: 'Third-party vendor data breach',
    frameworkCode: 'CIS',
    controlCode: 'CIS-15',
    linkType: 'Mitigates',
    rationale: 'Service provider management reduces vendor exposure.'
  },
  {
    riskTitle: 'Privacy incident from misconfigured access',
    frameworkCode: 'SOC2',
    controlCode: 'CC6',
    linkType: 'Mitigates',
    rationale: 'Logical and physical access controls prevent misconfigured access.'
  },
  {
    riskTitle: 'Privacy incident from misconfigured access',
    frameworkCode: 'GDPR',
    controlCode: 'Art.32',
    linkType: 'Mitigates',
    rationale: 'Security of processing safeguards personal data against unauthorised access.'
  },
  {
    riskTitle: 'Privacy incident from misconfigured access',
    frameworkCode: 'ISO27001',
    controlCode: 'A.9',
    linkType: 'Mitigates',
    rationale: 'Access control policy enforces least-privilege configuration.'
  },
  {
    riskTitle: 'Firewall rule review overdue',
    frameworkCode: 'SOC2',
    controlCode: 'CC6',
    linkType: 'Mitigates',
    rationale: 'Network access controls depend on current firewall rules.'
  },
  {
    riskTitle: 'Firewall rule review overdue',
    frameworkCode: 'PCI-DSS',
    controlCode: 'REQ-1',
    linkType: 'Mitigates',
    rationale: 'Network security controls require periodic firewall rule review.'
  },
  {
    riskTitle: 'Firewall rule review overdue',
    frameworkCode: 'CIS',
    controlCode: 'CIS-12',
    linkType: 'Tests',
    rationale: 'Network infrastructure management verifies firewall configuration.'
  },
  {
    riskTitle: 'Regulatory reporting deadline missed',
    frameworkCode: 'GDPR',
    controlCode: 'Art.33',
    linkType: 'Mitigates',
    rationale: 'Breach notification timelines drive regulatory reporting obligations.'
  },
  {
    riskTitle: 'Regulatory reporting deadline missed',
    frameworkCode: 'SOX',
    controlCode: 'SOX-302',
    linkType: 'Mitigates',
    rationale: 'Corporate responsibility for financial reports governs timely disclosure.'
  },
  {
    riskTitle: 'Critical system outage during peak season',
    frameworkCode: 'ISO22301',
    controlCode: 'ISO22301-8',
    linkType: 'Mitigates',
    rationale: 'Business continuity operation plans reduce outage impact.'
  },
  {
    riskTitle: 'Critical system outage during peak season',
    frameworkCode: 'SOC2',
    controlCode: 'A1',
    linkType: 'Monitors',
    rationale: 'Availability criteria monitor uptime during peak demand.'
  },
  {
    riskTitle: 'Phishing awareness campaign wrap-up',
    frameworkCode: 'CIS',
    controlCode: 'CIS-14',
    linkType: 'Mitigates',
    rationale: 'Security awareness training reduces phishing susceptibility.'
  },
  {
    riskTitle: 'Phishing awareness campaign wrap-up',
    frameworkCode: 'SOC2',
    controlCode: 'CC2',
    linkType: 'Mitigates',
    rationale: 'Communication and information controls reinforce awareness.'
  },
  {
    riskTitle: 'Supply chain disruption for key materials',
    frameworkCode: 'ISO27001',
    controlCode: 'A.15',
    linkType: 'Mitigates',
    rationale: 'Supplier relationship management addresses supply continuity.'
  },
  {
    riskTitle: 'Vendor SLA breach escalation',
    frameworkCode: 'CIS',
    controlCode: 'CIS-15',
    linkType: 'Monitors',
    rationale: 'Service provider management monitors SLA performance.'
  },
  {
    riskTitle: 'Cloud migration cost overrun',
    frameworkCode: 'COBIT',
    controlCode: 'BAI',
    linkType: 'Monitors',
    rationale: 'Build, acquire and implement governance tracks migration delivery.'
  }
];
