import type { FormSettings } from './types';

export const DEFAULT_FORM_SETTINGS: FormSettings = {
  risks: {
    fields: {
      Title: {
        label: 'Asset Name',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      },
      AM_Notes: {
        label: 'Description',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      AM_Status: {
        label: 'Status',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true,
        options: ['Available', 'Assigned', 'In Repair', 'Retired', 'Disposed']
      },
      RiskProfileType: {
        label: 'Profile Type',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: false
      },
      RiskCategory: {
        label: 'Category',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      },
      RiskSubCategory: {
        label: 'Sub-Category',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      riskBusiness: {
        label: 'Business',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      },
      RiskProject: {
        label: 'Project',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      RiskStrategy: {
        label: 'Risk Strategy',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Likelihood: {
        label: 'Likelihood',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: false
      },
      Consequence: {
        label: 'Impact',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: false
      },
      PotentialLikelihood: {
        label: 'Residual Likelihood',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: false
      },
      PotentialConsequence: {
        label: 'Residual Impact',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: false
      },
      Causes: { label: 'Causes', create: true, createRequired: false, edit: true, editRequired: false, view: true },
      RiskConsequences: {
        label: 'Consequences',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      ExistingControls: {
        label: 'Existing Controls',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      potentialcost: {
        label: 'Potential Cost',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Assesstheeffectivenessofcontrols: {
        label: 'Effectiveness of Controls',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: ['Good', 'Fair', 'Poor']
      },
      RiskResponse: {
        label: 'Risk Response',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      MitigationPlan: {
        label: 'Mitigation Plan',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      AssignedTo: {
        label: 'Assigned To',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      DateRiskIdentified: {
        label: 'Date Risk Identified',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      RiskDueDate: {
        label: 'Action Due Date',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Implementationreviewdate: {
        label: 'Implementation Review Date',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      AM_AssetId: {
        label: 'Asset ID',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: true
      }
    },
    tabs: [
      {
        key: 'general',
        label: 'General',
        fields: [
          'Title',
          'AM_AssetId',
          'AM_Category',
          'AM_SubCategory',
          'AM_AssetType',
          'AM_Status',
          'AM_SerialNumber',
          'AM_Manufacturer',
          'AM_Notes'
        ]
      },
      {
        key: 'assignment',
        label: 'Assignment & Location',
        fields: ['AM_AssignedTo', 'AM_AssignedDate', 'AM_Location', 'AM_Project', 'AM_Vendor']
      },
      {
        key: 'financial',
        label: 'Financial',
        fields: [
          'AM_Cost',
          'AM_PurchaseDate',
          'AM_PONumber',
          'AM_WarrantyExpiry',
          'AM_DepreciationMethod',
          'AM_UsefulLifeMonths',
          'AM_SalvageValue',
          'AM_ResidualValue'
        ]
      },
      {
        key: 'specifications',
        label: 'Specifications',
        fields: [
          'AM_OS',
          'AM_OSVersion',
          'AM_CPU',
          'AM_TotalMemory',
          'AM_Storage',
          'AM_IMEI',
          'AM_MACAddress',
          'AM_Barcode'
        ]
      }
    ]
  },
  business: {
    fields: {
      BusinessCode: {
        label: 'Business Code',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: true
      },
      Title: {
        label: 'Title',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      },
      Description: {
        label: 'Description',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Owner: {
        label: 'Owner',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Industry: {
        label: 'Industry',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      GeographicRegion: {
        label: 'Geographic Region',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      BusinessCriticality: {
        label: 'Business Criticality',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: ['High', 'Medium', 'Low']
      },
      RegulatoryEnvironment: {
        label: 'Regulatory Environment',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      RiskAppetite: {
        label: 'Risk Appetite',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: ['Conservative', 'Moderate', 'Aggressive']
      },
      BudgetRange: {
        label: 'Budget Range',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      KeyStakeholders: {
        label: 'Key Stakeholders',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      StrategicObjectives: {
        label: 'Strategic Objectives',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      ComplianceRequirements: {
        label: 'Compliance Requirements',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      }
    },
    order: [
      'BusinessCode',
      'Title',
      'Description',
      'Owner',
      'Industry',
      'GeographicRegion',
      'BusinessCriticality',
      'RegulatoryEnvironment',
      'RiskAppetite',
      'BudgetRange',
      'KeyStakeholders',
      'StrategicObjectives',
      'ComplianceRequirements'
    ],
    tabs: [
      {
        key: 'general',
        label: 'General',
        fields: [
          'BusinessCode',
          'Title',
          'Description',
          'Owner',
          'Industry',
          'GeographicRegion',
          'BusinessCriticality'
        ]
      },
      {
        key: 'governance',
        label: 'Governance',
        fields: [
          'RegulatoryEnvironment',
          'RiskAppetite',
          'BudgetRange',
          'KeyStakeholders',
          'StrategicObjectives',
          'ComplianceRequirements'
        ]
      }
    ]
  },
  lookups: {
    fields: {
      Title: {
        label: 'Title',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      },
      Rating: {
        label: 'Rating',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      }
    }
  },
  subCategories: {
    fields: {
      Title: {
        label: 'Title',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      },
      ParentCategory: {
        label: 'Parent Category',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      }
    }
  },
  projects: {
    fields: {
      Title: {
        label: 'Title',
        create: true,
        createRequired: true,
        edit: true,
        editRequired: true,
        view: true
      },
      Code: {
        label: 'Project Code',
        create: false,
        createRequired: false,
        edit: false,
        editRequired: false,
        view: true
      },
      Description: {
        label: 'Description',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Business: {
        label: 'Business',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Owner: {
        label: 'Owner',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      ProjectType: {
        label: 'Project Type',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: [
          'Strategic',
          'Operational',
          'Compliance',
          'Risk Mitigation',
          'Infrastructure',
          'Research',
          'Other'
        ]
      },
      ProjectStatus: {
        label: 'Project Status',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: ['Planning', 'Active', 'On Hold', 'Completed', 'Cancelled']
      },
      Priority: {
        label: 'Priority',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: ['Low', 'Medium', 'High', 'Critical']
      },
      RiskLevel: {
        label: 'Risk Level',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true,
        options: ['Low', 'Medium', 'High', 'Critical']
      },
      StartDate: {
        label: 'Start Date',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      EndDate: {
        label: 'End Date',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Budget: {
        label: 'Budget',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      ActualCost: {
        label: 'Actual Cost',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      ProjectManager: {
        label: 'Project Manager',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Sponsor: {
        label: 'Sponsor',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Stakeholders: {
        label: 'Stakeholders',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Objectives: {
        label: 'Objectives',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Deliverables: {
        label: 'Deliverables',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      SuccessCriteria: {
        label: 'Success Criteria',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      RiskAssessment: {
        label: 'Risk Assessment',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      MitigationStrategies: {
        label: 'Mitigation Strategies',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      ComplianceRequirements: {
        label: 'Compliance Requirements',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      RegulatoryEnvironment: {
        label: 'Regulatory Environment',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      GeographicScope: {
        label: 'Geographic Scope',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      TechnologyStack: {
        label: 'Technology Stack',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Dependencies: {
        label: 'Dependencies',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Assumptions: {
        label: 'Assumptions',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      Constraints: {
        label: 'Constraints',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      },
      LessonsLearned: {
        label: 'Lessons Learned',
        create: true,
        createRequired: false,
        edit: true,
        editRequired: false,
        view: true
      }
    },
    order: [
      'Title',
      'Code',
      'Description',
      'Business',
      'Owner',
      'ProjectType',
      'ProjectStatus',
      'Priority',
      'RiskLevel',
      'StartDate',
      'EndDate',
      'Budget',
      'ActualCost',
      'ProjectManager',
      'Sponsor',
      'Stakeholders',
      'Objectives',
      'Deliverables',
      'SuccessCriteria',
      'RiskAssessment',
      'MitigationStrategies',
      'ComplianceRequirements',
      'RegulatoryEnvironment',
      'GeographicScope',
      'TechnologyStack',
      'Dependencies',
      'Assumptions',
      'Constraints',
      'LessonsLearned'
    ],
    tabs: [
      {
        key: 'general',
        label: 'General',
        fields: [
          'Title',
          'Code',
          'Description',
          'Business',
          'ProjectType',
          'ProjectStatus',
          'Priority',
          'RiskLevel',
          'Owner'
        ]
      },
      {
        key: 'timeline',
        label: 'Timeline',
        fields: ['StartDate', 'EndDate']
      },
      {
        key: 'financials',
        label: 'Financials',
        fields: ['Budget', 'ActualCost']
      },
      {
        key: 'people',
        label: 'People',
        fields: ['ProjectManager', 'Sponsor', 'Stakeholders']
      },
      {
        key: 'details',
        label: 'Details',
        fields: [
          'Objectives',
          'Deliverables',
          'SuccessCriteria',
          'RiskAssessment',
          'MitigationStrategies',
          'ComplianceRequirements',
          'RegulatoryEnvironment',
          'GeographicScope',
          'TechnologyStack',
          'Dependencies',
          'Assumptions',
          'Constraints',
          'LessonsLearned'
        ]
      }
    ]
  }
};
