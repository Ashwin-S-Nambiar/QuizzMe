import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

const nf = new Intl.NumberFormat('en');
const STRIP = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function Digit({ digit, place }) {
  const [shown, setShown] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    if (mounted.current) {
      setShown(digit);
      return;
    }
    mounted.current = true;
    const id = requestAnimationFrame(() => setShown(digit));
    return () => cancelAnimationFrame(id);
  }, [digit]);

  return (
    <span className="roll-col">
      <span
        className="roll-strip"
        style={{
          transform: `translateY(${-shown * 10}%)`,
          transitionDelay: `${place * 45}ms`,
        }}
      >
        {STRIP.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  );
}

export default function RollingNumber({ value, className = '' }) {
  const text = value == null ? '' : nf.format(value);
  const chars = [...text];
  let place = chars.filter((c) => c >= '0' && c <= '9').length;

  return (
    <span className={`roll ${className}`}>
      <AnimatePresence initial={false} mode="popLayout">
        {value != null && (
          <motion.span
            key="n"
            className="inline-flex"
            initial={{ opacity: 0, filter: 'blur(4px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{
              opacity: 0,
              filter: 'blur(4px)',
              transition: { duration: 0.12 },
            }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            aria-hidden="true"
          >
            {chars.map((c) => {
              if (c < '0' || c > '9') {
                return (
                  <span key={`s${place}`} className="roll-sep">
                    {c}
                  </span>
                );
              }
              place -= 1;
              return (
                <Digit key={`d${place}`} digit={Number(c)} place={place} />
              );
            })}
          </motion.span>
        )}
      </AnimatePresence>
      <span className="sr-only">{text}</span>
    </span>
  );
}
