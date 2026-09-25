import { Check, Fire } from '@phosphor-icons/react';
import { motion, useAnimate } from 'motion/react';
import { useMediaQuery } from '../hooks/index.js';
import { sfx } from '../lib/sound.js';

function Sticker({ at, rotate, order, float, className = '', children }) {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
  return (
    <motion.div
      className={`absolute ${at} ${fine ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
      style={{ rotate }}
      drag={fine}
      dragSnapToOrigin
      dragElastic={0.6}
      dragTransition={{ bounceStiffness: 420, bounceDamping: 24 }}
      whileDrag={{ zIndex: 10 }}
    >
      <motion.div
        initial={{ opacity: 0, transform: 'translateY(14px) scale(0.94)' }}
        animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
        transition={{
          type: 'spring',
          duration: 0.55,
          bounce: 0.28,
          delay: 0.12 + order * 0.06,
        }}
      >
        <motion.div
          animate={{ transform: ['translateY(-3px)', 'translateY(3px)'] }}
          transition={{
            duration: float,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: 'mirror',
            ease: 'easeInOut',
            delay: 0.8 + order * 0.4,
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

function Mark() {
  const [scope, animate] = useAnimate();
  return (
    <button
      ref={scope}
      type="button"
      aria-label="Spin the question mark"
      data-sfx="none"
      tabIndex={-1}
      onClick={() => {
        sfx.pop();
        animate(
          scope.current,
          { rotate: [0, 360] },
          { type: 'spring', duration: 0.7, bounce: 0.3 },
        );
      }}
      className="grid size-14 place-items-center rounded-full bg-lilac font-display text-3xl font-bold text-lilac-ink shadow-(--shadow-md) sm:size-20 sm:text-5xl"
    >
      ?
    </button>
  );
}

const pill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium shadow-(--shadow-sm) sm:text-base';

export default function Stickers() {
  return (
    <div className="relative h-19 w-full sm:h-28" aria-hidden="true">
      <Sticker at="top-0 left-0" rotate={-8} order={0} float={4.6}>
        <Mark />
      </Sticker>
      <Sticker
        at="top-1 left-[4.5rem] sm:left-[6.25rem]"
        rotate={5}
        order={1}
        float={5.4}
      >
        <span className={`${pill} bg-butter text-butter-ink`}>
          <Fire size={17} weight="fill" />5 in a row
        </span>
      </Sticker>
      <Sticker
        at="top-9 left-[min(11.5rem,calc(100%-6.25rem))] sm:top-14 sm:left-[7rem]"
        rotate={-4}
        order={2}
        float={5}
      >
        <span className={`${pill} bg-mint text-mint-ink`}>
          <Check size={16} weight="bold" />
          Correct
        </span>
      </Sticker>
      <Sticker
        at="top-2 left-[15.75rem]"
        rotate={3}
        order={3}
        float={6}
        className="hidden sm:block"
      >
        <div className="w-56 rounded-2xl bg-raised p-3 shadow-(--shadow-md) ring-1 ring-line">
          <p className="font-display text-[0.95rem] leading-tight font-semibold">
            Capital of Australia?
          </p>
          <div className="mt-2 flex gap-1.5 text-xs font-medium">
            <span className="rounded-full bg-bad-tint px-2 py-1 text-bad-ink line-through decoration-bad/50">
              Sydney
            </span>
            <span className="rounded-full bg-good-tint px-2 py-1 text-good-ink">
              Canberra
            </span>
          </div>
        </div>
      </Sticker>
      <Sticker
        at="top-16 left-[31rem]"
        rotate={-6}
        order={4}
        float={4.2}
        className="hidden xl:block"
      >
        <span className={`${pill} bg-peach text-peach-ink`}>Hard</span>
      </Sticker>
    </div>
  );
}
