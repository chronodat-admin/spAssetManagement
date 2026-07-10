import type { ITranslationDictionary } from './types';
import { en } from './en';

export const de: ITranslationDictionary = {
  ...en,
  nav: {
    ...en.nav,
    dashboard: 'Dashboard',
    allAssets: 'Alle Assets',
    assignedToMe: 'Mir zugewiesen',
    available: 'Verfügbar',
    maintenance: 'Wartung',
    requestAsset: 'Asset anfordern',
    myRequests: 'Meine Anfragen',
    manageRequests: 'Anfragen verwalten',
    scanAsset: 'Asset scannen',
    bulkAssign: 'Massenzuweisung',
    bulkReturn: 'Massenrückgabe',
    settings: 'Einstellungen'
  },
  pages: {
    ...en.pages,
    maintenance: 'Wartung',
    requestAsset: 'Asset anfordern',
    settings: 'Einstellungen'
  },
  common: {
    ...en.common,
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    search: 'Suchen',
    export: 'Exportieren',
    import: 'Importieren'
  },
  settings: {
    ...en.settings,
    language: 'Sprache',
    userRoles: 'Benutzerrollen',
    intuneSync: 'Intune-Synchronisierung',
    syncNow: 'Jetzt synchronisieren'
  }
};
