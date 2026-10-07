'use client';

import { useRouter } from 'next/navigation';
import { useForm } from '@/context/FormContext';

/** Floating "Reset Demo" control shown in the prototype screenshots. */
export default function ResetDemo() {
  const router = useRouter();
  const { reset } = useForm();

  return (
    <button
      onClick={() => {
        reset();
        router.push('/');
      }}
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        right: 'calc(env(safe-area-inset-right, 0px) + 12px)',
        zIndex: 50,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: 'rgba(26,26,26,0.62)',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '7px 12px',
        fontSize: '0.82rem',
        fontWeight: 500,
        backdropFilter: 'blur(4px)',
      }}
    >
      ↻ Reset Demo
    </button>
  );
}
