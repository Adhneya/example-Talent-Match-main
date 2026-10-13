'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import RoleTargetPicker, { suggestTarget } from '@/components/RoleTargetPicker';

/** S-05 Target — the last onboarding step. Lands in the deck by replace, not push (IA §8). */
export default function TargetPage() {
  const router = useRouter();
  const { profile, chooseTarget } = useStore();
  const suggested = profile ? suggestTarget(profile.roleTitle) : null;
  const [target, setTarget] = useState<string | null>(suggested);

  return (
    <div className="reveal">
      <h1 className="t-h1">What role are you after?</h1>
      <p className="t-lead" style={{ marginTop: 12 }}>
        We’ll rank live roles against your profile for this target. You can change it any time.
      </p>

      <div style={{ marginTop: 28 }}>
        <RoleTargetPicker value={target} onChange={setTarget} suggested={suggested} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 10, marginTop: 24 }}>
        <button className="btn btn--lg" onClick={() => router.push('/onboarding/build')}>
          Back
        </button>
        <button
          className="btn btn--primary btn--lg btn--block"
          disabled={!target}
          onClick={() => {
            if (!target) return;
            chooseTarget(target);
            // Replace: onboarding is not returnable once the deck is reached.
            router.replace('/swipe');
          }}
        >
          Start swiping
        </button>
      </div>
    </div>
  );
}
