import type { ITranslationDictionary } from './types';
import { en } from './en';

export const fr: ITranslationDictionary = {
  ...en,
  nav: {
    ...en.nav,
    dashboard: 'Tableau de bord',
    allAssets: 'Tous les actifs',
    assignedToMe: 'Assignés à moi',
    available: 'Disponibles',
    maintenance: 'Maintenance',
    requestAsset: 'Demander un actif',
    myRequests: 'Mes demandes',
    manageRequests: 'Gérer les demandes',
    scanAsset: 'Scanner un actif',
    bulkAssign: 'Attribution en masse',
    bulkReturn: 'Retour en masse',
    settings: 'Paramètres'
  },
  pages: {
    ...en.pages,
    dashboard: 'Tableau de bord',
    maintenance: 'Maintenance',
    requestAsset: 'Demander un actif',
    settings: 'Paramètres'
  },
  common: {
    ...en.common,
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    search: 'Rechercher',
    export: 'Exporter',
    import: 'Importer'
  },
  settings: {
    ...en.settings,
    language: 'Langue',
    userRoles: 'Rôles utilisateur',
    intuneSync: 'Synchronisation Intune',
    syncNow: 'Synchroniser'
  }
};
