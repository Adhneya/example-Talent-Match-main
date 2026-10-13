'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { LinkedInUrlField, ResumeDropzone, normalizeLinkedIn } from '@/components/onboarding/ConnectInputs';

/** S-02 Connect — a URL paste and a file upload. Nothing else typed by hand (slide 3). */
export default function ConnectPage() {
  const router = useRouter();
  const { draft, setConnect } = useStore();
  const [url, setUrl] = useState(draft.linkedinUrl);
  const [resume, setResume] = useState(draft.resume);

  const linkedin = normalizeLinkedIn(url);
  const ready = !!linkedin && !!resume;

  function next() {
    if (!linkedin || !resume) return;
    setConnect(linkedin, resume);
    router.push('/onboarding/build');
  }

  return (
    <div className="reveal">
      <h1 className="t-h1">Connect your experience</h1>
      <p className="t-lead" style={{ marginTop: 12 }}>
        We build your profile from these two. You’ll review it before anything goes live.
      </p>

      <form
        noValidate
        style={{ marginTop: 32, display: 'grid', gap: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          next();
        }}
      >
        <LinkedInUrlField value={url} onChange={setUrl} />
        <ResumeDropzone value={resume} onChange={setResume} />

        <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={!ready}>
          Build my profile
        </button>
      </form>
    </div>
  );
}
