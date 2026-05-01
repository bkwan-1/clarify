import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      {description && (
        <p className="text-[13px] text-[var(--text-secondary)] mb-5">{description}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-[6px] text-[13px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
            destructive
              ? 'bg-[var(--danger)] text-white hover:opacity-90'
              : 'bg-[var(--accent)] text-white hover:opacity-90'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
