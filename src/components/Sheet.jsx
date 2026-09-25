import { X } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMediaQuery } from '../hooks/index.js';

export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  wide = false,
}) {
  const mobile = useMediaQuery('(max-width: 639px)');
  const reduce = useReducedMotion();
  const panel = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panel.current) return;
      const items = panel.current.querySelectorAll(
        'button:not(:disabled), a[href], input, [tabindex]:not([tabindex="-1"])',
      );
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => panel.current?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  const variants = mobile
    ? {
        hidden: {
          transform: reduce ? 'translateY(0%)' : 'translateY(100%)',
          opacity: reduce ? 0 : 1,
          transition: { duration: 0.26, ease: [0.32, 0.72, 0, 1] },
        },
        shown: { transform: 'translateY(0%)', opacity: 1 },
      }
    : {
        hidden: {
          opacity: 0,
          transform: reduce ? 'scale(1)' : 'scale(0.96)',
          transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] },
        },
        shown: { opacity: 1, transform: 'scale(1)' },
      };

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-(--scrim)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.24 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            variants={variants}
            initial="hidden"
            animate="shown"
            exit="hidden"
            transition={
              mobile
                ? { duration: 0.42, ease: [0.32, 0.72, 0, 1] }
                : { duration: 0.22, ease: [0.23, 1, 0.32, 1] }
            }
            drag={mobile && !reduce ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.7 }}
            dragSnapToOrigin
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 550) onClose();
            }}
            className={`relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] bg-raised shadow-(--shadow-lg) outline-none sm:rounded-[1.75rem] ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
          >
            {mobile && (
              <div
                className="flex justify-center pt-2.5 pb-1"
                aria-hidden="true"
              >
                <span className="h-1.5 w-10 rounded-full bg-surface-2" />
              </div>
            )}
            <header className="flex items-center justify-between gap-4 px-5 pt-2 pb-3 sm:pt-5">
              <h2 className="font-display text-xl font-semibold tracking-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="icon-btn press glass"
                aria-label="Close"
              >
                <X weight="bold" size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </div>
            {footer && (
              <div className="bottom-bar border-t border-line px-5 pt-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
