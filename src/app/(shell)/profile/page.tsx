'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/store/AppStore';
import ProfileConfirmCard from '@/components/ProfileConfirmCard';
import RoleTargetPicker from '@/components/RoleTargetPicker';
import type { Profile } from '@/lib/types';

/**
 * S-11 Profile — derived from "confirm or tweak" (slide 3). Without it the
 * only edit moment would be a single step during onboarding.
 */
export default function ProfilePage() {
  const { profile, updateProfile, targetRoleId, chooseTarget, sources } = useStore();
  const [draft, setDraft] = useState<Profile | null>(profile);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => setDraft(profile), [profile]);

  if (!profile || !draft) return null;
  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  return (
    <section className="col page">
      <div className="page__head">
        <h1 className="t-h1">Your profile</h1>
        <p className="t-lead" style={{ marginTop: 8 }}>
          This is what we match against. Tap Edit on anything that’s changed.
        </p>
      </div>

      <ProfileConfirmCard
        value={draft}
        onChange={(p) => {
          setDraft(p);
          setSavedAt(null);
        }}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 16, minHeight: 48 }} aria-live="polite">
        {dirty ? (
          <>
            <button
              className="btn btn--primary btn--lg"
              onClick={() => {
                updateProfile(draft);
                setSavedAt(Date.now());
              }}
            >
              Save changes
            </button>
            <button className="btn btn--ghost" onClick={() => setDraft(profile)}>
              Discard
            </button>
          </>
        ) : (
          savedAt && <span className="field__msg field__msg--ok">Saved. Your deck is re-ranked.</span>
        )}
      </div>

      <section id="target" style={{ marginTop: 40, scrollMarginTop: 80 }}>
        <h2 className="t-h3">Target role</h2>
        <p className="t-body t-muted" style={{ marginTop: 6, marginBottom: 16 }}>
          Changing this re-ranks your deck straight away.
        </p>
        <RoleTargetPicker value={targetRoleId} onChange={chooseTarget} />
      </section>

      {sources && (
        <section style={{ marginTop: 40 }}>
          <h2 className="t-h3">Built from</h2>
          <dl className="card" style={{ marginTop: 14, padding: '16px 20px', display: 'grid', gap: 12 }}>
            <div>
              <dt className="t-label">LinkedIn</dt>
              <dd style={{ margin: '2px 0 0', overflowWrap: 'anywhere' }}>{sources.linkedinUrl}</dd>
            </div>
            <div>
              <dt className="t-label">Resume</dt>
              <dd style={{ margin: '2px 0 0' }}>{sources.resumeName}</dd>
            </div>
          </dl>
        </section>
      )}
    </section>
  );
}
