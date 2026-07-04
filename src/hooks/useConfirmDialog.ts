import * as React from 'react';
import { ConfirmDialog } from '../components/Dialog/ConfirmDialog';

export interface IConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export function useConfirmDialog(): {
  confirm: (options: IConfirmDialogOptions) => Promise<boolean>;
  confirmDialog: React.ReactNode;
} {
  const resolveRef = React.useRef<((value: boolean) => void) | null>(null);
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<IConfirmDialogOptions>({
    title: '',
    message: ''
  });

  const confirm = React.useCallback((next: IConfirmDialogOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setOptions(next);
      setOpen(true);
    });
  }, []);

  const close = React.useCallback((result: boolean) => {
    setOpen(false);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const confirmDialog = React.createElement(ConfirmDialog, {
    open,
    title: options.title,
    message: options.message,
    confirmLabel: options.confirmLabel ?? 'Delete',
    cancelLabel: options.cancelLabel ?? 'Cancel',
    onConfirm: () => close(true),
    onCancel: () => close(false),
    onOpenChange: (isOpen: boolean) => {
      if (!isOpen) {
        close(false);
      }
    }
  });

  return { confirm, confirmDialog };
}
