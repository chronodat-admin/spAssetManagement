export interface ISharePointAttachment {
  FileName: string;
  ServerRelativeUrl: string;
}

export interface IAssetAttachmentSyncInput {
  uploads?: File[];
  deletes?: string[];
}
