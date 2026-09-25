import {
  ChartBar,
  Moon,
  SpeakerHigh,
  SpeakerSlash,
  Sun,
} from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useScrolled } from '../hooks/index.js';
import { sfx, soundStore } from '../lib/sound.js';
import { useStore } from '../lib/store.js';

function Swap({ on, a, b }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={on ? 'a' : 'b'}
        initial={{
          opacity: 0,
          transform: 'rotate(-45deg) scale(0.8)',
          filter: 'blur(2px)',
        }}
        animate={{
          opacity: 1,
          transform: 'rotate(0deg) scale(1)',
          filter: 'blur(0px)',
        }}
        exit={{
          opacity: 0,
          transform: 'rotate(45deg) scale(0.8)',
          filter: 'blur(2px)',
        }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
        className="grid place-items-center"
      >
        {on ? a : b}
      </motion.span>
    </AnimatePresence>
  );
}

export default function Topbar({ theme, onToggleTheme, onOpenStats, onHome }) {
  const scrolled = useScrolled();
  const sound = useStore(soundStore);

  return (
    <header
      className={`sticky top-0 z-30 pt-(--safe-t) transition-[background-color,box-shadow] duration-200 ${
        scrolled
          ? 'bg-bg/92 shadow-[0_1px_0_var(--color-line)] backdrop-blur-xl backdrop-saturate-150'
          : ''
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-(--gutter)">
        <button
          type="button"
          onClick={onHome}
          className="group press -ml-1 rounded-lg px-1 font-display text-[1.4rem] font-bold tracking-tight"
        >
          QuizzMe
          <span className="inline-block text-accent transition-transform duration-200 ease-out group-hover:-translate-y-0.5">
            !
          </span>
        </button>
        <div className="glass flex items-center gap-0.5 rounded-full p-1">
          <button
            type="button"
            data-sfx="none"
            onClick={() => {
              soundStore.set(!sound);
              if (!sound) setTimeout(() => sfx.pick(), 0);
            }}
            className="icon-btn press size-9! overflow-hidden hover-fine:bg-surface"
            aria-label={sound ? 'Mute sounds' : 'Turn sounds on'}
            aria-pressed={sound}
          >
            <Swap
              on={sound}
              a={<SpeakerHigh size={18} weight="duotone" />}
              b={<SpeakerSlash size={18} weight="duotone" />}
            />
          </button>
          <button
            type="button"
            onClick={onOpenStats}
            className="icon-btn press size-9! hover-fine:bg-surface"
            aria-label="Your stats"
          >
            <ChartBar size={18} weight="duotone" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="icon-btn press size-9! overflow-hidden hover-fine:bg-surface"
            aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
          >
            <Swap
              on={theme === 'dark'}
              a={<Sun size={18} weight="duotone" />}
              b={<Moon size={18} weight="duotone" />}
            />
          </button>
        </div>
      </div>
    </header>
  );
}
