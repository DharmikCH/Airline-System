import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

const VISIBLE_MS = 3600;
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, kind = 'info') => {
    const id = nextId++;
    setToasts((list) => [...list, { id, message, kind }]);
  }, []);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onDone={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ id, message, kind, onDone }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    // Two frames: the first lets the browser paint the hidden starting
    // position, so the second has something to transition from.
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setShown(true));
    });
    const hide = setTimeout(() => setShown(false), VISIBLE_MS);
    // Safety net in case transitionend never fires (e.g. a background tab).
    const gone = setTimeout(() => onDone(id), VISIBLE_MS + 600);
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(hide);
      clearTimeout(gone);
    };
  }, [id, onDone]);

  return (
    <div
      className={'toast toast--' + kind + (shown ? ' is-in' : '')}
      onTransitionEnd={(e) => {
        if (!shown && e.propertyName === 'opacity') onDone(id);
      }}
    >
      {message}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
