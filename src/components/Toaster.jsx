import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { dismissToast, toastStore, useStore } from '../lib/store.js';

function Toast({ toast }) {
  const hovering = useRef(false);

  useEffect(() => {
    let left = toast.duration;
    let started = Date.now();
    let id;
    const arm = () => {
      clearTimeout(id);
      started = Date.now();
      id = setTimeout(() => {
        if (hovering.current || document.hidden) arm();
        else dismissToast(toast.id);
      }, left);
    };
    const onVisibility = () => {
      if (document.hidden) {
        clearTimeout(id);
        left = Math.max(1200, left - (Date.now() - started));
      } else {
        arm();
      }
    };
    arm();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(id);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [toast.id, toast.duration]);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, transform: 'translateY(16px) scale(0.97)' }}
      animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
      exit={{
        opacity: 0,
        transform: 'translateY(8px) scale(0.97)',
        transition: { duration: 0.16 },
      }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.1, bottom: 0.8 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 40 || info.velocity.y > 400) dismissToast(toast.id);
      }}
      onPointerEnter={() => {
        hovering.current = true;
      }}
      onPointerLeave={() => {
        hovering.current = false;
      }}
      className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl bg-ink py-2.5 pr-2.5 pl-4 text-sm text-bg shadow-(--shadow-lg)"
      role="status"
    >
      <span className="min-w-0 flex-1 text-pretty">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action.onClick();
            dismissToast(toast.id);
          }}
          className="press shrink-0 rounded-full bg-bg/15 px-3 py-1.5 font-medium hover-fine:bg-bg/25"
        >
          {toast.action.label}
        </button>
      )}
    </motion.li>
  );
}

export default function Toaster() {
  const toasts = useStore(toastStore);
  return (
    <ol
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--safe-b)+6rem)] z-60 mx-auto flex w-[min(26rem,calc(100%-2rem))] flex-col items-center gap-2"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </ol>
  );
}
