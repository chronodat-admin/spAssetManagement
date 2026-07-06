import { FormTemplateField } from './types';

export interface IDefaultFormTemplate {
  /** Category titles this template should attach to (first match wins). */
  categoryTitles: string[];
  templateName: string;
  fields: FormTemplateField[];
}

export const DEFAULT_FORM_TEMPLATES: IDefaultFormTemplate[] = [
  {
    categoryTitles: ['IT Hardware', 'Hardware', 'IT Equipment', 'Computers'],
    templateName: 'IT Hardware Form',
    fields: [
      { id: 'f-manufacturer', type: 'text', label: 'Manufacturer', placeholder: 'e.g. Dell, HP, Lenovo, Apple', required: true },
      { id: 'f-model', type: 'text', label: 'Model', placeholder: 'e.g. Latitude 5540', required: false },
      { id: 'f-processor', type: 'text', label: 'Processor (CPU)', placeholder: 'e.g. Intel Core i7-1355U', required: false },
      { id: 'f-memory', type: 'dropdown', label: 'Memory (RAM)', options: ['4 GB', '8 GB', '16 GB', '32 GB', '64 GB', '128 GB'], required: false },
      { id: 'f-storage', type: 'text', label: 'Storage', placeholder: 'e.g. 512 GB SSD', required: false },
      { id: 'f-operating-system', type: 'dropdown', label: 'Operating System', options: ['Windows 11', 'Windows 10', 'macOS', 'Linux', 'ChromeOS', 'Other'], required: false },
      { id: 'f-mac-address', type: 'text', label: 'MAC Address', placeholder: '00:1A:2B:3C:4D:5E', required: false },
      { id: 'f-warranty-expiry', type: 'date', label: 'Warranty Expiry', required: false }
    ]
  },
  {
    categoryTitles: ['Software', 'Applications', 'Licenses'],
    templateName: 'Software Form',
    fields: [
      { id: 'f-publisher', type: 'text', label: 'Publisher', placeholder: 'e.g. Microsoft, Adobe', required: true },
      { id: 'f-version', type: 'text', label: 'Version', placeholder: 'e.g. 2024, 16.0', required: false },
      { id: 'f-license-type', type: 'dropdown', label: 'License Type', options: ['Perpetual', 'Subscription', 'OEM', 'Volume', 'Open Source', 'Trial'], required: false },
      { id: 'f-license-key', type: 'text', label: 'License Key', placeholder: 'Product / activation key', required: false },
      { id: 'f-seats', type: 'number', label: 'Number of Seats', placeholder: '0', required: false },
      { id: 'f-renewal-date', type: 'date', label: 'Renewal Date', required: false },
      { id: 'f-support-contact', type: 'email', label: 'Support Contact', placeholder: 'support@vendor.com', required: false }
    ]
  },
  {
    categoryTitles: ['Furniture', 'Office Furniture', 'Fixtures'],
    templateName: 'Furniture Form',
    fields: [
      { id: 'f-material', type: 'dropdown', label: 'Material', options: ['Wood', 'Metal', 'Plastic', 'Glass', 'Fabric', 'Leather', 'Other'], required: false },
      { id: 'f-color', type: 'text', label: 'Color / Finish', placeholder: 'e.g. Black, Oak', required: false },
      { id: 'f-dimensions', type: 'text', label: 'Dimensions (W x D x H)', placeholder: 'e.g. 120 x 60 x 75 cm', required: false },
      { id: 'f-condition', type: 'dropdown', label: 'Condition', options: ['New', 'Good', 'Fair', 'Poor', 'Damaged'], required: false },
      { id: 'f-room-location', type: 'text', label: 'Room / Location', placeholder: 'e.g. Meeting Room 2, Floor 3', required: false }
    ]
  },
  {
    categoryTitles: ['Vehicles', 'Vehicle', 'Fleet'],
    templateName: 'Vehicle Form',
    fields: [
      { id: 'f-make', type: 'text', label: 'Make', placeholder: 'e.g. Toyota, Ford', required: true },
      { id: 'f-model', type: 'text', label: 'Model', placeholder: 'e.g. Corolla, Transit', required: false },
      { id: 'f-year', type: 'number', label: 'Year', placeholder: 'e.g. 2024', required: false },
      { id: 'f-vin', type: 'text', label: 'VIN', placeholder: 'Vehicle identification number', required: false },
      { id: 'f-license-plate', type: 'text', label: 'License Plate', placeholder: 'Registration number', required: false },
      { id: 'f-odometer', type: 'number', label: 'Odometer (Mileage)', placeholder: '0', required: false },
      { id: 'f-fuel-type', type: 'dropdown', label: 'Fuel Type', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Other'], required: false },
      { id: 'f-registration-expiry', type: 'date', label: 'Registration Expiry', required: false },
      { id: 'f-insurance-policy', type: 'text', label: 'Insurance Policy Number', placeholder: 'Policy reference', required: false }
    ]
  },
  {
    categoryTitles: ['Other', 'General', 'Miscellaneous'],
    templateName: 'General Asset Form',
    fields: [
      { id: 'f-manufacturer', type: 'text', label: 'Manufacturer / Supplier', placeholder: 'Who made or supplied this asset?', required: false },
      { id: 'f-model', type: 'text', label: 'Model / Reference', placeholder: 'Model or reference number', required: false },
      { id: 'f-condition', type: 'dropdown', label: 'Condition', options: ['New', 'Good', 'Fair', 'Poor', 'Damaged'], required: false },
      { id: 'f-additional-notes', type: 'textarea', label: 'Additional Notes', placeholder: 'Any other relevant information...', required: false }
    ]
  }
];
