'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { track } from '@/lib/analytics';
import { endSession } from '@/lib/session';
import { LinkedInStep, ResumeDropzone } from '@/components/onboarding/ConnectInputs';

/**
 * S-02 Connect — Sign in with LinkedIn, then a file upload. Nothing typed by
 * hand (slide 3). LinkedIn gives identity; the profile is built from the resume.
 */
export default function ConnectPage() {
  const router = useRouter();
  const { draft, setConnect, user } = useStore();
  const [resume, setResume] = useState(draft.resume);

  const ready = !!user && !!resume;

  function next() {
    if (!user || !resume) return;
    setConnect(resume);
    track('connect_submitted');
    router.push('/onboarding/build');
  }

  return (
    <div className="reveal">
      <h1 className="t-h1">Connect your experience</h1>
      <p className="t-lead" style={{ marginTop: 12 }}>
        Sign in with LinkedIn, then add your resume — we build your profile from it. You’ll review it before anything
        goes live.
      </p>

      <form
        noValidate
        style={{ marginTop: 32, display: 'grid', gap: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <LinkedInStep user={user} onSignOut={() => void endSession()} />
        <ResumeDropzone value={resume} onChange={setResume} disabled={!user} />

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={!ready}>
          Build my profile
        </button>
      </form>
    </div>
  );
}
