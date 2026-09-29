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

const EASE = [0.23, 1, 0.32, 1];

function Swap({ on, a, b }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={on ? 'a' : 'b'}
        initial={{ opacity: 0, transform: 'rotate(-60deg) scale(0.7)' }}
        animate={{ opacity: 1, transform: 'rotate(0deg) scale(1)' }}
        exit={{ opacity: 0, transform: 'rotate(60deg) scale(0.7)' }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0.2 }}
        className="grid place-items-center"
      >
        {on ? a : b}
      </motion.span>
    </AnimatePresence>
  );
}

export function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className="card-back relative grid h-7 w-5.5 place-items-center rounded-[5px] shadow-none"
        aria-hidden="true"
      >
        <span className="printed grid size-4 place-items-center rounded-full bg-yellow text-[0.7rem] text-on-flat">
          ?
        </span>
      </span>
      <span className="printed text-[1.55rem] tracking-[-0.01em] uppercase">
        QuizzMe!
      </span>
    </span>
  );
}

// One header for every screen, so switching screens never moves the page.
// During a round Play renders its own controls into the slot.
export default function Topbar({
  playing,
  onSlot,
  theme,
  onToggleTheme,
  onOpenStats,
  onHome,
}) {
  const scrolled = useScrolled();
  const sound = useStore(soundStore);

  return (
    <header
      className={`sticky top-0 z-30 pt-(--safe-t) transition-[background-color,box-shadow] duration-200 ${
        scrolled ? 'bg-bg shadow-[0_1px_0_var(--color-line)]' : 'bg-bg/0'
      }`}
    >
      <div className="relative h-16">
        <AnimatePresence initial={false}>
          {!playing && (
            <motion.div
              key="tools"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
              transition={{ duration: 0.2, ease: EASE }}
              className="absolute inset-0 mx-auto flex max-w-6xl items-center justify-between gap-3 px-(--gutter)"
            >
              <button
                type="button"
                onClick={onHome}
                className="press -ml-1 rounded-lg px-1"
                aria-label="QuizzMe! home"
              >
                <Logo />
              </button>
              <div className="-mr-2 flex items-center">
                <button
                  type="button"
                  data-sfx="none"
                  onClick={() => {
                    soundStore.set(!sound);
                    if (!sound) setTimeout(() => sfx.pick(), 0);
                  }}
                  className="icon-btn press overflow-hidden"
                  aria-label={sound ? 'Mute sounds' : 'Turn sounds on'}
                  data-tip={sound ? 'Mute' : 'Sound on'}
                  aria-pressed={sound}
                >
                  <Swap
                    on={sound}
                    a={<SpeakerHigh size={19} weight="bold" />}
                    b={<SpeakerSlash size={19} weight="bold" />}
                  />
                </button>
                <button
                  type="button"
                  onClick={onOpenStats}
                  className="icon-btn press"
                  aria-label="Your stats"
                  data-tip="Your stats"
                >
                  <ChartBar size={19} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="icon-btn press overflow-hidden"
                  aria-label={
                    theme === 'dark' ? 'Use light theme' : 'Use dark theme'
                  }
                  data-tip={theme === 'dark' ? 'Light theme' : 'Dark theme'}
                >
                  <Swap
                    on={theme === 'dark'}
                    a={<Sun size={19} weight="bold" />}
                    b={<Moon size={19} weight="bold" />}
                  />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={onSlot} className="pointer-events-none absolute inset-0" />
      </div>
    </header>
  );
}
