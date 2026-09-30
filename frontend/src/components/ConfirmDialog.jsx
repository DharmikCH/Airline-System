import { useEffect, useRef } from 'react';

// A confirmation step for actions that cannot be undone, such as cancelling a
// booking or deactivating a flight.
//
// Built on the native <dialog> element, which traps focus, closes on Escape
// and draws its own backdrop. Focus starts on the safe button, so pressing
// Enter by reflex never performs the destructive action.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Go back',
  danger = false,
  busy = false,
  onConfirm,
  onClose
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onCancel={(e) => {
        // Escape should not abandon a request that is already in flight.
        if (busy) e.preventDefault();
      }}
      onClick={(e) => {
        // A click that lands on the <dialog> itself, not its content, was on
        // the backdrop.
        if (e.target === ref.current && !busy) onClose();
      }}
    >
      <div className="dialog__body">
        <h3>{title}</h3>
        {children}
      </div>
      <div className="dialog__foot">
        <button type="button" className="btn btn--ghost" onClick={onClose} disabled={busy} autoFocus>
          {cancelLabel}
        </button>
        <button
          type="button"
          className={'btn ' + (danger ? 'btn--danger' : 'btn--primary')}
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
