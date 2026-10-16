'use client';

import type { ReactNode } from 'react';
import { useReducedMotion } from 'motion/react';
import * as m from 'motion/react-m';

const SPRING = { type: 'spring', stiffness: 100, damping: 20 } as const;

/**
 * Section heading that clip-reveals line by line as it enters the viewport:
 * each line sits in an overflow-hidden mask and rises from translateY(100%).
 * Once only. With reduced motion every line simply renders in place.
 */
export default function RevealHeading({
  id,
  lines,
  className = '',
  as: Tag = 'h2',
}: {
  id?: string;
  lines: ReactNode[];
  className?: string;
  as?: 'h2' | 'h3';
}) {
  const reduced = useReducedMotion();
  return (
    <Tag id={id} className={className}>
      {lines.map((line, i) => (
        // pb/-mb keep descenders inside the mask without changing the line box.
        <span key={i} className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
          <m.span
            className="block"
            initial={reduced ? false : { y: '100%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once: true, margin: '0px 0px -12% 0px' }}
            transition={reduced ? { duration: 0 } : { ...SPRING, delay: i * 0.09 }}
          >
            {line}
          </m.span>
        </span>
      ))}
    </Tag>
  );
}
