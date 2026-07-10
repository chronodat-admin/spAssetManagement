import type { ITranslationDictionary } from './types';
import { en } from './en';

/** Spanish — key Tier 1 strings; falls back to English for missing keys at runtime. */
export const es: ITranslationDictionary = {
  ...en,
  nav: {
    ...en.nav,
    dashboard: 'Panel',
    allAssets: 'Todos los activos',
    assignedToMe: 'Asignados a mí',
    available: 'Disponibles',
    maintenance: 'Mantenimiento',
    requestAsset: 'Solicitar activo',
    myRequests: 'Mis solicitudes',
    manageRequests: 'Gestionar solicitudes',
    scanAsset: 'Escanear activo',
    bulkAssign: 'Asignación masiva',
    bulkReturn: 'Devolución masiva',
    settings: 'Configuración'
  },
  pages: {
    ...en.pages,
    dashboard: 'Panel',
    allAssets: 'Todos los activos',
    maintenance: 'Mantenimiento',
    requestAsset: 'Solicitar activo',
    myRequests: 'Mis solicitudes',
    manageRequests: 'Gestionar solicitudes',
    scanAsset: 'Escanear activo',
    settings: 'Configuración'
  },
  common: {
    ...en.common,
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    search: 'Buscar',
    export: 'Exportar',
    import: 'Importar',
    approve: 'Aprobar',
    reject: 'Rechazar'
  },
  settings: {
    ...en.settings,
    language: 'Idioma',
    userRoles: 'Roles de usuario',
    intuneSync: 'Sincronización Intune',
    bulkImport: 'Importación masiva',
    syncNow: 'Sincronizar ahora'
  },
  barcode: {
    ...en.barcode,
    scan: 'Escanear código',
    generate: 'Generar etiquetas'
  }
};
