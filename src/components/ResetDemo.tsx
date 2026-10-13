'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';

/** Development-only control to clear all local state and restart onboarding. */
export default function ResetDemo() {
  const router = useRouter();
  const { reset } = useStore();

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <button
      className="dev-reset"
      onClick={() => {
        reset();
        router.replace('/');
      }}
    >
      ↻ Reset (dev)
    </button>
  );
}
