export interface IAssetVersionChange {
  fieldLabel: string;
  previousValue?: string;
  newValue?: string;
}

export interface IAssetVersionHistoryEntry {
  versionId: number;
  versionLabel: string;
  createdAt: string;
  editorName: string;
  editorEmail?: string;
  isCurrent: boolean;
  isCreated: boolean;
  changes: IAssetVersionChange[];
}
