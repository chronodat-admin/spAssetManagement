import * as React from 'react';
import { ConfirmDialog } from '../components/Dialog/ConfirmDialog';
import { AssetService } from '../services/AssetService';
import {
  buildLookupDeleteMessage,
  type ILookupDeleteReference
} from '../utils/lookupDeleteReferences';

export interface ILookupDeleteConfirmItem {
  id: number;
  title: string;
}

export interface ILookupDeleteConfirmOptions {
  listTitle: string;
  items: ILookupDeleteConfirmItem[];
  dialogTitle: string;
}

export function useLookupDeleteConfirm(assetService: AssetService): {
  confirmLookupDelete: (options: ILookupDeleteConfirmOptions) => Promise<boolean>;
  confirmDialog: React.ReactNode;
  checkingDelete: boolean;
} {
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);
  const [open, setOpen] = React.useState(false);
  const [checkingDelete, setCheckingDelete] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [references, setReferences] = React.useState<ILookupDeleteReference[]>([]);
  const [confirmLabel, setConfirmLabel] = React.useState('Delete');

  const close = React.useCallback((result: boolean) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const confirmLookupDelete = React.useCallback(
    async (options: ILookupDeleteConfirmOptions): Promise<boolean> => {
      const { listTitle, items, dialogTitle } = options;
      if (items.length === 0) {
        return false;
      }

      const itemLabel =
        items.length === 1 ? `"${items[0].title}"` : `${items.length} selected items`;

      setCheckingDelete(true);
      try {
        const impact = await assetService.getLookupDeleteImpact(
          listTitle,
          items.map((item) => item.id),
          items.map((item) => item.title)
        );
        const activeReferences = impact.references.filter(
          (entry: ILookupDeleteReference) => entry.count > 0
        );
        setTitle(dialogTitle);
        setMessage(buildLookupDeleteMessage(itemLabel, impact.references));
        setReferences(activeReferences);
        setConfirmLabel(activeReferences.length > 0 ? 'Delete anyway' : 'Delete');
      } catch {
        setTitle(dialogTitle);
        setMessage(`Delete ${itemLabel}? Unable to verify references. Delete anyway?`);
        setReferences([]);
        setConfirmLabel('Delete anyway');
      } finally {
        setCheckingDelete(false);
      }

      return new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setOpen(true);
      });
    },
    [assetService]
  );

  const confirmDialog = React.createElement(ConfirmDialog, {
    open,
    title,
    message,
    references,
    confirmLabel,
    onConfirm: () => close(true),
    onCancel: () => close(false),
    onOpenChange: (isOpen: boolean) => {
      if (!isOpen) {
        close(false);
      }
    }
  });

  return { confirmLookupDelete, confirmDialog, checkingDelete };
}
