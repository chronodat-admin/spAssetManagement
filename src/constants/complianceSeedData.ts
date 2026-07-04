import { AssessmentStatus, ComplianceItemStatus } from '../models/ICompliance';

export interface IComplianceSeedControl {
  controlCode: string;
  title: string;
  category: string;
  sortOrder: number;
}

export interface IComplianceSeedFramework {
  code: string;
  name: string;
  version: string;
  description: string;
  controls: IComplianceSeedControl[];
}

export const COMPLIANCE_BUILT_IN_FRAMEWORKS: IComplianceSeedFramework[] = [
  {
    "code": "ISO27001",
    "name": "ISO 27001",
    "version": "2022",
    "description": "Information security management systems",
    "controls": [
      {
        "controlCode": "A.5",
        "title": "Information Security Policies",
        "category": "Organizational",
        "sortOrder": 1
      },
      {
        "controlCode": "A.6",
        "title": "Organization of Information Security",
        "category": "Organizational",
        "sortOrder": 2
      },
      {
        "controlCode": "A.7",
        "title": "Human Resource Security",
        "category": "People",
        "sortOrder": 3
      },
      {
        "controlCode": "A.8",
        "title": "Asset Management",
        "category": "Physical",
        "sortOrder": 4
      },
      {
        "controlCode": "A.9",
        "title": "Access Control",
        "category": "Technological",
        "sortOrder": 5
      },
      {
        "controlCode": "A.10",
        "title": "Cryptography",
        "category": "Technological",
        "sortOrder": 6
      },
      {
        "controlCode": "A.11",
        "title": "Physical and Environmental Security",
        "category": "Physical",
        "sortOrder": 7
      },
      {
        "controlCode": "A.12",
        "title": "Operations Security",
        "category": "Technological",
        "sortOrder": 8
      },
      {
        "controlCode": "A.13",
        "title": "Communications Security",
        "category": "Technological",
        "sortOrder": 9
      },
      {
        "controlCode": "A.14",
        "title": "System Acquisition, Development and Maintenance",
        "category": "Technological",
        "sortOrder": 10
      },
      {
        "controlCode": "A.15",
        "title": "Supplier Relationships",
        "category": "Organizational",
        "sortOrder": 11
      },
      {
        "controlCode": "A.16",
        "title": "Information Security Incident Management",
        "category": "Organizational",
        "sortOrder": 12
      },
      {
        "controlCode": "A.17",
        "title": "Business Continuity Management",
        "category": "Organizational",
        "sortOrder": 13
      },
      {
        "controlCode": "A.18",
        "title": "Compliance",
        "category": "Organizational",
        "sortOrder": 14
      }
    ]
  },
  {
    "code": "NIST-CSF",
    "name": "NIST Cybersecurity Framework",
    "version": "2.0",
    "description": "Cybersecurity risk management framework",
    "controls": [
      {
        "controlCode": "GV",
        "title": "Govern",
        "category": "Governance",
        "sortOrder": 1
      },
      {
        "controlCode": "ID",
        "title": "Identify",
        "category": "Identify",
        "sortOrder": 2
      },
      {
        "controlCode": "PR",
        "title": "Protect",
        "category": "Protect",
        "sortOrder": 3
      },
      {
        "controlCode": "DE",
        "title": "Detect",
        "category": "Detect",
        "sortOrder": 4
      },
      {
        "controlCode": "RS",
        "title": "Respond",
        "category": "Respond",
        "sortOrder": 5
      },
      {
        "controlCode": "RC",
        "title": "Recover",
        "category": "Recover",
        "sortOrder": 6
      }
    ]
  },
  {
    "code": "SOX",
    "name": "Sarbanes-Oxley Act",
    "version": "2002",
    "description": "Financial reporting and internal controls",
    "controls": [
      {
        "controlCode": "SOX-302",
        "title": "Corporate Responsibility for Financial Reports",
        "category": "Financial Controls",
        "sortOrder": 1
      },
      {
        "controlCode": "SOX-404",
        "title": "Management Assessment of Internal Controls",
        "category": "Internal Controls",
        "sortOrder": 2
      },
      {
        "controlCode": "SOX-409",
        "title": "Real Time Issuer Disclosures",
        "category": "Disclosure",
        "sortOrder": 3
      },
      {
        "controlCode": "SOX-802",
        "title": "Criminal Penalties for Altering Documents",
        "category": "Document Retention",
        "sortOrder": 4
      },
      {
        "controlCode": "SOX-906",
        "title": "Corporate Responsibility for Financial Reports",
        "category": "Certification",
        "sortOrder": 5
      }
    ]
  },
  {
    "code": "GDPR",
    "name": "General Data Protection Regulation",
    "version": "2018",
    "description": "EU data protection and privacy regulation",
    "controls": [
      {
        "controlCode": "Art.5",
        "title": "Principles of Processing",
        "category": "Data Processing",
        "sortOrder": 1
      },
      {
        "controlCode": "Art.6",
        "title": "Lawfulness of Processing",
        "category": "Legal Basis",
        "sortOrder": 2
      },
      {
        "controlCode": "Art.13",
        "title": "Information to Data Subject",
        "category": "Transparency",
        "sortOrder": 3
      },
      {
        "controlCode": "Art.15",
        "title": "Right of Access",
        "category": "Data Subject Rights",
        "sortOrder": 4
      },
      {
        "controlCode": "Art.17",
        "title": "Right to Erasure",
        "category": "Data Subject Rights",
        "sortOrder": 5
      },
      {
        "controlCode": "Art.25",
        "title": "Data Protection by Design",
        "category": "Technical Measures",
        "sortOrder": 6
      },
      {
        "controlCode": "Art.32",
        "title": "Security of Processing",
        "category": "Security",
        "sortOrder": 7
      },
      {
        "controlCode": "Art.33",
        "title": "Notification of Breach to Authority",
        "category": "Breach Notification",
        "sortOrder": 8
      },
      {
        "controlCode": "Art.35",
        "title": "Data Protection Impact Assessment",
        "category": "Assessment",
        "sortOrder": 9
      },
      {
        "controlCode": "Art.37",
        "title": "Designation of DPO",
        "category": "Governance",
        "sortOrder": 10
      }
    ]
  },
  {
    "code": "HIPAA",
    "name": "Health Insurance Portability and Accountability Act",
    "version": "1996",
    "description": "Healthcare data protection standards",
    "controls": [
      {
        "controlCode": "164.308",
        "title": "Administrative Safeguards",
        "category": "Administrative",
        "sortOrder": 1
      },
      {
        "controlCode": "164.310",
        "title": "Physical Safeguards",
        "category": "Physical",
        "sortOrder": 2
      },
      {
        "controlCode": "164.312",
        "title": "Technical Safeguards",
        "category": "Technical",
        "sortOrder": 3
      },
      {
        "controlCode": "164.314",
        "title": "Organizational Requirements",
        "category": "Organizational",
        "sortOrder": 4
      },
      {
        "controlCode": "164.316",
        "title": "Policies and Procedures",
        "category": "Documentation",
        "sortOrder": 5
      },
      {
        "controlCode": "164.402",
        "title": "Breach Notification",
        "category": "Breach",
        "sortOrder": 6
      }
    ]
  },
  {
    "code": "PCI-DSS",
    "name": "PCI DSS",
    "version": "4.0",
    "description": "Payment card industry data security standard for organizations handling cardholder data",
    "controls": [
      {
        "controlCode": "REQ-1",
        "title": "Install and Maintain Network Security Controls",
        "category": "Network Security",
        "sortOrder": 1
      },
      {
        "controlCode": "REQ-2",
        "title": "Apply Secure Configurations to All System Components",
        "category": "Secure Configuration",
        "sortOrder": 2
      },
      {
        "controlCode": "REQ-3",
        "title": "Protect Stored Account Data",
        "category": "Data Protection",
        "sortOrder": 3
      },
      {
        "controlCode": "REQ-4",
        "title": "Protect Cardholder Data with Strong Cryptography During Transmission",
        "category": "Encryption",
        "sortOrder": 4
      },
      {
        "controlCode": "REQ-5",
        "title": "Protect All Systems and Networks from Malicious Software",
        "category": "Malware Protection",
        "sortOrder": 5
      },
      {
        "controlCode": "REQ-6",
        "title": "Develop and Maintain Secure Systems and Software",
        "category": "Secure Development",
        "sortOrder": 6
      },
      {
        "controlCode": "REQ-7",
        "title": "Restrict Access to System Components and Cardholder Data",
        "category": "Access Control",
        "sortOrder": 7
      },
      {
        "controlCode": "REQ-8",
        "title": "Identify Users and Authenticate Access to System Components",
        "category": "Authentication",
        "sortOrder": 8
      },
      {
        "controlCode": "REQ-9",
        "title": "Restrict Physical Access to Cardholder Data",
        "category": "Physical Security",
        "sortOrder": 9
      },
      {
        "controlCode": "REQ-10",
        "title": "Log and Monitor All Access to System Components and Cardholder Data",
        "category": "Logging & Monitoring",
        "sortOrder": 10
      },
      {
        "controlCode": "REQ-11",
        "title": "Test Security of Systems and Networks Regularly",
        "category": "Security Testing",
        "sortOrder": 11
      },
      {
        "controlCode": "REQ-12",
        "title": "Support Information Security with Organizational Policies and Programs",
        "category": "Security Policy",
        "sortOrder": 12
      }
    ]
  },
  {
    "code": "SOC2",
    "name": "SOC 2",
    "version": "2022",
    "description": "Service organization controls for security, availability, processing integrity, confidentiality, and privacy",
    "controls": [
      {
        "controlCode": "CC1",
        "title": "Control Environment",
        "category": "Common Criteria",
        "sortOrder": 1
      },
      {
        "controlCode": "CC2",
        "title": "Communication and Information",
        "category": "Common Criteria",
        "sortOrder": 2
      },
      {
        "controlCode": "CC3",
        "title": "Risk Assessment",
        "category": "Common Criteria",
        "sortOrder": 3
      },
      {
        "controlCode": "CC4",
        "title": "Monitoring Activities",
        "category": "Common Criteria",
        "sortOrder": 4
      },
      {
        "controlCode": "CC5",
        "title": "Control Activities",
        "category": "Common Criteria",
        "sortOrder": 5
      },
      {
        "controlCode": "CC6",
        "title": "Logical and Physical Access Controls",
        "category": "Common Criteria",
        "sortOrder": 6
      },
      {
        "controlCode": "CC7",
        "title": "System Operations",
        "category": "Common Criteria",
        "sortOrder": 7
      },
      {
        "controlCode": "CC8",
        "title": "Change Management",
        "category": "Common Criteria",
        "sortOrder": 8
      },
      {
        "controlCode": "CC9",
        "title": "Risk Mitigation",
        "category": "Common Criteria",
        "sortOrder": 9
      },
      {
        "controlCode": "A1",
        "title": "Availability",
        "category": "Additional Criteria",
        "sortOrder": 10
      },
      {
        "controlCode": "PI1",
        "title": "Processing Integrity",
        "category": "Additional Criteria",
        "sortOrder": 11
      },
      {
        "controlCode": "C1",
        "title": "Confidentiality",
        "category": "Additional Criteria",
        "sortOrder": 12
      },
      {
        "controlCode": "P1",
        "title": "Privacy",
        "category": "Additional Criteria",
        "sortOrder": 13
      }
    ]
  },
  {
    "code": "CCPA",
    "name": "CCPA / CPRA",
    "version": "2023",
    "description": "California consumer privacy and data protection rights",
    "controls": [
      {
        "controlCode": "CCPA-1798.100",
        "title": "Right to Know / Access",
        "category": "Consumer Rights",
        "sortOrder": 1
      },
      {
        "controlCode": "CCPA-1798.105",
        "title": "Right to Delete",
        "category": "Consumer Rights",
        "sortOrder": 2
      },
      {
        "controlCode": "CCPA-1798.106",
        "title": "Right to Correct",
        "category": "Consumer Rights",
        "sortOrder": 3
      },
      {
        "controlCode": "CCPA-1798.110",
        "title": "Right to Know What Is Collected",
        "category": "Transparency",
        "sortOrder": 4
      },
      {
        "controlCode": "CCPA-1798.115",
        "title": "Right to Know What Is Sold or Shared",
        "category": "Transparency",
        "sortOrder": 5
      },
      {
        "controlCode": "CCPA-1798.120",
        "title": "Right to Opt-Out of Sale or Sharing",
        "category": "Consumer Rights",
        "sortOrder": 6
      },
      {
        "controlCode": "CCPA-1798.121",
        "title": "Right to Limit Sensitive Data Use",
        "category": "Consumer Rights",
        "sortOrder": 7
      },
      {
        "controlCode": "CCPA-1798.125",
        "title": "Non-Discrimination",
        "category": "Business Obligations",
        "sortOrder": 8
      },
      {
        "controlCode": "CCPA-1798.130",
        "title": "Notice and Process Requirements",
        "category": "Business Obligations",
        "sortOrder": 9
      },
      {
        "controlCode": "CCPA-1798.135",
        "title": "Opt-Out Link Requirements",
        "category": "Business Obligations",
        "sortOrder": 10
      }
    ]
  },
  {
    "code": "DORA",
    "name": "Digital Operational Resilience Act",
    "version": "2025",
    "description": "EU regulation on digital operational resilience for the financial sector",
    "controls": [
      {
        "controlCode": "DORA-Art.5",
        "title": "ICT Risk Management Framework",
        "category": "Risk Management",
        "sortOrder": 1
      },
      {
        "controlCode": "DORA-Art.6",
        "title": "ICT Risk Management Governance",
        "category": "Governance",
        "sortOrder": 2
      },
      {
        "controlCode": "DORA-Art.7",
        "title": "ICT Systems, Protocols and Tools",
        "category": "Technical Measures",
        "sortOrder": 3
      },
      {
        "controlCode": "DORA-Art.8",
        "title": "Identification of ICT Risks",
        "category": "Risk Management",
        "sortOrder": 4
      },
      {
        "controlCode": "DORA-Art.9",
        "title": "Protection and Prevention",
        "category": "Protection",
        "sortOrder": 5
      },
      {
        "controlCode": "DORA-Art.10",
        "title": "Detection",
        "category": "Detection",
        "sortOrder": 6
      },
      {
        "controlCode": "DORA-Art.11",
        "title": "Response and Recovery",
        "category": "Response",
        "sortOrder": 7
      },
      {
        "controlCode": "DORA-Art.17",
        "title": "ICT-Related Incident Classification",
        "category": "Incident Management",
        "sortOrder": 8
      },
      {
        "controlCode": "DORA-Art.19",
        "title": "Reporting of Major ICT-Related Incidents",
        "category": "Incident Reporting",
        "sortOrder": 9
      },
      {
        "controlCode": "DORA-Art.24",
        "title": "General Requirements for Digital Resilience Testing",
        "category": "Testing",
        "sortOrder": 10
      },
      {
        "controlCode": "DORA-Art.26",
        "title": "Threat-Led Penetration Testing",
        "category": "Testing",
        "sortOrder": 11
      },
      {
        "controlCode": "DORA-Art.28",
        "title": "ICT Third-Party Risk Management",
        "category": "Third-Party Risk",
        "sortOrder": 12
      }
    ]
  },
  {
    "code": "NIS2",
    "name": "NIS2 Directive",
    "version": "2024",
    "description": "EU directive on network and information security for essential and important entities",
    "controls": [
      {
        "controlCode": "NIS2-Art.21a",
        "title": "Risk Analysis and Information System Security Policies",
        "category": "Governance",
        "sortOrder": 1
      },
      {
        "controlCode": "NIS2-Art.21b",
        "title": "Incident Handling",
        "category": "Incident Response",
        "sortOrder": 2
      },
      {
        "controlCode": "NIS2-Art.21c",
        "title": "Business Continuity and Crisis Management",
        "category": "Continuity",
        "sortOrder": 3
      },
      {
        "controlCode": "NIS2-Art.21d",
        "title": "Supply Chain Security",
        "category": "Supply Chain",
        "sortOrder": 4
      },
      {
        "controlCode": "NIS2-Art.21e",
        "title": "Security in Network and Information Systems Acquisition",
        "category": "Procurement",
        "sortOrder": 5
      },
      {
        "controlCode": "NIS2-Art.21f",
        "title": "Vulnerability Handling and Disclosure",
        "category": "Vulnerability Mgmt",
        "sortOrder": 6
      },
      {
        "controlCode": "NIS2-Art.21g",
        "title": "Cybersecurity Risk Management Assessment Practices",
        "category": "Assessment",
        "sortOrder": 7
      },
      {
        "controlCode": "NIS2-Art.21h",
        "title": "Cryptography and Encryption",
        "category": "Technical",
        "sortOrder": 8
      },
      {
        "controlCode": "NIS2-Art.21i",
        "title": "Human Resources Security and Access Control",
        "category": "Access Control",
        "sortOrder": 9
      },
      {
        "controlCode": "NIS2-Art.21j",
        "title": "Multi-Factor Authentication and Secure Communications",
        "category": "Authentication",
        "sortOrder": 10
      },
      {
        "controlCode": "NIS2-Art.23",
        "title": "Incident Reporting Obligations",
        "category": "Reporting",
        "sortOrder": 11
      }
    ]
  },
  {
    "code": "LGPD",
    "name": "LGPD",
    "version": "2020",
    "description": "Brazil general data protection law (Lei Geral de Proteção de Dados)",
    "controls": [
      {
        "controlCode": "LGPD-Art.6",
        "title": "Principles of Data Processing",
        "category": "Principles",
        "sortOrder": 1
      },
      {
        "controlCode": "LGPD-Art.7",
        "title": "Legal Bases for Processing",
        "category": "Legal Basis",
        "sortOrder": 2
      },
      {
        "controlCode": "LGPD-Art.11",
        "title": "Processing of Sensitive Personal Data",
        "category": "Sensitive Data",
        "sortOrder": 3
      },
      {
        "controlCode": "LGPD-Art.14",
        "title": "Processing of Children and Adolescents Data",
        "category": "Minors Data",
        "sortOrder": 4
      },
      {
        "controlCode": "LGPD-Art.18",
        "title": "Data Subject Rights",
        "category": "Data Subject Rights",
        "sortOrder": 5
      },
      {
        "controlCode": "LGPD-Art.37",
        "title": "Records of Processing Activities",
        "category": "Documentation",
        "sortOrder": 6
      },
      {
        "controlCode": "LGPD-Art.38",
        "title": "Data Protection Impact Assessment",
        "category": "Assessment",
        "sortOrder": 7
      },
      {
        "controlCode": "LGPD-Art.41",
        "title": "Data Protection Officer",
        "category": "Governance",
        "sortOrder": 8
      },
      {
        "controlCode": "LGPD-Art.46",
        "title": "Security Measures",
        "category": "Security",
        "sortOrder": 9
      },
      {
        "controlCode": "LGPD-Art.48",
        "title": "Incident Notification",
        "category": "Breach Notification",
        "sortOrder": 10
      }
    ]
  },
  {
    "code": "POPIA",
    "name": "POPIA",
    "version": "2021",
    "description": "South Africa Protection of Personal Information Act",
    "controls": [
      {
        "controlCode": "POPIA-S8",
        "title": "Accountability",
        "category": "Principles",
        "sortOrder": 1
      },
      {
        "controlCode": "POPIA-S9",
        "title": "Processing Limitation",
        "category": "Principles",
        "sortOrder": 2
      },
      {
        "controlCode": "POPIA-S10",
        "title": "Purpose Specification",
        "category": "Principles",
        "sortOrder": 3
      },
      {
        "controlCode": "POPIA-S11",
        "title": "Further Processing Limitation",
        "category": "Principles",
        "sortOrder": 4
      },
      {
        "controlCode": "POPIA-S12",
        "title": "Information Quality",
        "category": "Principles",
        "sortOrder": 5
      },
      {
        "controlCode": "POPIA-S13",
        "title": "Openness",
        "category": "Principles",
        "sortOrder": 6
      },
      {
        "controlCode": "POPIA-S14",
        "title": "Security Safeguards",
        "category": "Security",
        "sortOrder": 7
      },
      {
        "controlCode": "POPIA-S15",
        "title": "Data Subject Participation",
        "category": "Data Subject Rights",
        "sortOrder": 8
      },
      {
        "controlCode": "POPIA-S22",
        "title": "Notification of Security Compromises",
        "category": "Breach Notification",
        "sortOrder": 9
      },
      {
        "controlCode": "POPIA-S55",
        "title": "Information Officer",
        "category": "Governance",
        "sortOrder": 10
      }
    ]
  },
  {
    "code": "ISO22301",
    "name": "ISO 22301",
    "version": "2019",
    "description": "Business continuity management systems standard",
    "controls": [
      {
        "controlCode": "ISO22301-4",
        "title": "Context of the Organization",
        "category": "Planning",
        "sortOrder": 1
      },
      {
        "controlCode": "ISO22301-5",
        "title": "Leadership",
        "category": "Governance",
        "sortOrder": 2
      },
      {
        "controlCode": "ISO22301-6",
        "title": "Planning",
        "category": "Planning",
        "sortOrder": 3
      },
      {
        "controlCode": "ISO22301-7",
        "title": "Support",
        "category": "Support",
        "sortOrder": 4
      },
      {
        "controlCode": "ISO22301-8",
        "title": "Operation (BIA, Strategy, Plans)",
        "category": "Operations",
        "sortOrder": 5
      },
      {
        "controlCode": "ISO22301-9",
        "title": "Performance Evaluation",
        "category": "Evaluation",
        "sortOrder": 6
      },
      {
        "controlCode": "ISO22301-10",
        "title": "Improvement",
        "category": "Improvement",
        "sortOrder": 7
      }
    ]
  },
  {
    "code": "COBIT",
    "name": "COBIT",
    "version": "2019",
    "description": "IT governance and management framework",
    "controls": [
      {
        "controlCode": "EDM",
        "title": "Evaluate, Direct and Monitor",
        "category": "Governance",
        "sortOrder": 1
      },
      {
        "controlCode": "APO",
        "title": "Align, Plan and Organize",
        "category": "Management",
        "sortOrder": 2
      },
      {
        "controlCode": "BAI",
        "title": "Build, Acquire and Implement",
        "category": "Management",
        "sortOrder": 3
      },
      {
        "controlCode": "DSS",
        "title": "Deliver, Service and Support",
        "category": "Management",
        "sortOrder": 4
      },
      {
        "controlCode": "MEA",
        "title": "Monitor, Evaluate and Assess",
        "category": "Management",
        "sortOrder": 5
      }
    ]
  },
  {
    "code": "CIS",
    "name": "CIS Controls",
    "version": "8.0",
    "description": "Prioritized set of cybersecurity best practices",
    "controls": [
      {
        "controlCode": "CIS-1",
        "title": "Inventory and Control of Enterprise Assets",
        "category": "Asset Management",
        "sortOrder": 1
      },
      {
        "controlCode": "CIS-2",
        "title": "Inventory and Control of Software Assets",
        "category": "Asset Management",
        "sortOrder": 2
      },
      {
        "controlCode": "CIS-3",
        "title": "Data Protection",
        "category": "Data Protection",
        "sortOrder": 3
      },
      {
        "controlCode": "CIS-4",
        "title": "Secure Configuration of Enterprise Assets and Software",
        "category": "Configuration",
        "sortOrder": 4
      },
      {
        "controlCode": "CIS-5",
        "title": "Account Management",
        "category": "Access Control",
        "sortOrder": 5
      },
      {
        "controlCode": "CIS-6",
        "title": "Access Control Management",
        "category": "Access Control",
        "sortOrder": 6
      },
      {
        "controlCode": "CIS-7",
        "title": "Continuous Vulnerability Management",
        "category": "Vulnerability Mgmt",
        "sortOrder": 7
      },
      {
        "controlCode": "CIS-8",
        "title": "Audit Log Management",
        "category": "Logging",
        "sortOrder": 8
      },
      {
        "controlCode": "CIS-9",
        "title": "Email and Web Browser Protections",
        "category": "Endpoint Security",
        "sortOrder": 9
      },
      {
        "controlCode": "CIS-10",
        "title": "Malware Defenses",
        "category": "Endpoint Security",
        "sortOrder": 10
      },
      {
        "controlCode": "CIS-11",
        "title": "Data Recovery",
        "category": "Recovery",
        "sortOrder": 11
      },
      {
        "controlCode": "CIS-12",
        "title": "Network Infrastructure Management",
        "category": "Network Security",
        "sortOrder": 12
      },
      {
        "controlCode": "CIS-13",
        "title": "Network Monitoring and Defense",
        "category": "Network Security",
        "sortOrder": 13
      },
      {
        "controlCode": "CIS-14",
        "title": "Security Awareness and Skills Training",
        "category": "People",
        "sortOrder": 14
      },
      {
        "controlCode": "CIS-15",
        "title": "Service Provider Management",
        "category": "Third-Party Risk",
        "sortOrder": 15
      },
      {
        "controlCode": "CIS-16",
        "title": "Application Software Security",
        "category": "Application Security",
        "sortOrder": 16
      },
      {
        "controlCode": "CIS-17",
        "title": "Incident Response Management",
        "category": "Incident Response",
        "sortOrder": 17
      },
      {
        "controlCode": "CIS-18",
        "title": "Penetration Testing",
        "category": "Security Testing",
        "sortOrder": 18
      }
    ]
  }
];

/** Sample assessments seeded on first compliance dashboard load (idempotent by title). */
export type ComplianceAssessmentSeedProfile =
  | 'all-not-assessed'
  | 'gdpr-in-progress'
  | 'iso27001-complete'
  | 'soc2-in-progress'
  | 'pci-complete';

export interface IComplianceSeedAssessment {
  name: string;
  frameworkCode: string;
  status: AssessmentStatus;
  dueDate: string;
  completedDate?: string;
  itemProfile: ComplianceAssessmentSeedProfile;
}

export const COMPLIANCE_ASSESSMENT_SEED_DATA: IComplianceSeedAssessment[] = [
  {
    name: 'GDPR Compliance Initiative Q1 2026',
    frameworkCode: 'GDPR',
    status: 'In Progress',
    dueDate: '2026-06-30',
    itemProfile: 'gdpr-in-progress'
  },
  {
    name: 'ISO 27001 Annual Certification Review',
    frameworkCode: 'ISO27001',
    status: 'Complete',
    dueDate: '2025-12-01',
    completedDate: '2025-12-15',
    itemProfile: 'iso27001-complete'
  },
  {
    name: 'HIPAA Security Rule Baseline Assessment',
    frameworkCode: 'HIPAA',
    status: 'Draft',
    dueDate: '2026-09-01',
    itemProfile: 'all-not-assessed'
  },
  {
    name: 'SOC 2 Type II Readiness Review',
    frameworkCode: 'SOC2',
    status: 'In Progress',
    dueDate: '2026-08-15',
    itemProfile: 'soc2-in-progress'
  },
  {
    name: 'PCI DSS Merchant Level 1 Audit',
    frameworkCode: 'PCI-DSS',
    status: 'Complete',
    dueDate: '2026-01-10',
    completedDate: '2026-01-20',
    itemProfile: 'pci-complete'
  }
];

export function resolveComplianceSeedItemStatuses(
  profile: ComplianceAssessmentSeedProfile,
  controlCodes: string[]
): Record<string, ComplianceItemStatus> {
  const result: Record<string, ComplianceItemStatus> = {};

  const assign = (codes: string[], statuses: ComplianceItemStatus[]): void => {
    codes.forEach((code, index) => {
      result[code] = statuses[index] ?? statuses[statuses.length - 1];
    });
  };

  switch (profile) {
    case 'all-not-assessed':
      break;
    case 'gdpr-in-progress':
      assign(controlCodes.slice(0, 7), [
        'Compliant',
        'Compliant',
        'Partially Compliant',
        'Non-Compliant',
        'Compliant',
        'Partially Compliant',
        'Compliant'
      ]);
      break;
    case 'iso27001-complete':
      assign(controlCodes.slice(0, 12), Array(12).fill('Compliant') as ComplianceItemStatus[]);
      if (controlCodes[12]) {
        result[controlCodes[12]] = 'Partially Compliant';
      }
      if (controlCodes[13]) {
        result[controlCodes[13]] = 'Not Applicable';
      }
      break;
    case 'soc2-in-progress':
      assign(controlCodes.slice(0, 8), [
        'Compliant',
        'Compliant',
        'Partially Compliant',
        'Compliant',
        'Non-Compliant',
        'Compliant',
        'Partially Compliant',
        'Compliant'
      ]);
      break;
    case 'pci-complete':
      assign(controlCodes.slice(0, 10), Array(10).fill('Compliant') as ComplianceItemStatus[]);
      if (controlCodes[10]) {
        result[controlCodes[10]] = 'Non-Compliant';
      }
      if (controlCodes[11]) {
        result[controlCodes[11]] = 'Non-Compliant';
      }
      break;
    default:
      break;
  }

  return result;
}
