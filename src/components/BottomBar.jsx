import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

export default function BottomBar({ children }) {
  return createPortal(
    <motion.div
      initial={{ transform: 'translateY(100%)' }}
      animate={{ transform: 'translateY(0%)' }}
      exit={{
        transform: 'translateY(100%)',
        transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] },
      }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      className="bottom-bar fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/92 px-(--gutter) pt-3 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-xl items-center gap-2">{children}</div>
    </motion.div>,
    document.body,
  );
}
