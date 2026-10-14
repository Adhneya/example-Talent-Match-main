'use client';

import { useId, useRef, useState } from 'react';
import { Doc, LinkedInMark, Tick, Upload } from '@/components/Icons';
import LinkedInButton from '@/components/LinkedInButton';
import { track } from '@/lib/analytics';
import type { SessionUser } from '@/store/AppStore';

/* ── LinkedIn (Sign in with LinkedIn — decision "Auth") ─────────── */

/**
 * Step one of Connect. It replaces the old "paste your LinkedIn URL" field, so
 * onboarding still asks for exactly two things (slide 3).
 */
export function LinkedInStep({ user, onSignOut }: { user: SessionUser | null; onSignOut: () => void }) {
  return (
    <div className="field">
      <span className="field__label">LinkedIn</span>
      {user ? (
        <div className="account-chip">
          <LinkedInMark size={22} style={{ color: 'var(--linkedin)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name ?? 'Signed in'}
            </div>
            <div className="t-fine">Signed in with LinkedIn</div>
          </div>
          <Tick size={20} style={{ color: 'var(--success)' }} />
          <button type="button" className="btn btn--ghost" onClick={onSignOut}>
            Not you?
          </button>
        </div>
      ) : (
        <>
          <LinkedInButton location="connect" redirectTo="/onboarding/connect" />
          <span className="field__msg t-fine">We use it to sign you in. Nothing is posted to LinkedIn.</span>
        </>
      )}
    </div>
  );
}

/* ── Resume upload (PDF / DOCX — slide 4) ─────────────────────── */

const ACCEPTED = ['.pdf', '.docx'];
const ACCEPT_ATTR =
  '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function isAccepted(file: File) {
  const name = file.name.toLowerCase();
  return ACCEPTED.some((ext) => name.endsWith(ext));
}

function sizeLabel(bytes: number) {
  return bytes > 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

export function ResumeDropzone({
  value,
  onChange,
  disabled = false,
}: {
  value: { name: string; size: number } | null;
  onChange: (v: { name: string; size: number } | null) => void;
  /** Before sign-in: the resume has no one to belong to yet. */
  disabled?: boolean;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState<string | null>(null);

  function take(file: File | undefined) {
    if (!file) return;
    if (!isAccepted(file)) {
      setRejected(file.name);
      // Extension only — never the file name.
      track('connect_file_rejected', { extension: (file.name.split('.').pop() ?? '').toLowerCase().slice(0, 10) });
      return;
    }
    setRejected(null);
    onChange({ name: file.name, size: file.size });
  }

  const input = (
    <input
      ref={inputRef}
      id={id}
      type="file"
      accept={ACCEPT_ATTR}
      disabled={disabled}
      className="sr-only"
      aria-describedby={`${id}-msg`}
      onChange={(e) => {
        take(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
  );

  return (
    <div className="field">
      <span className="field__label" id={`${id}-label`}>
        Resume
      </span>

      {value ? (
        <div className="dropzone dropzone--filled">
          <Doc size={26} style={{ color: 'var(--navy)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {value.name}
            </div>
            <div className="t-fine">{sizeLabel(value.size)}</div>
          </div>
          <Tick size={20} style={{ color: 'var(--success)' }} />
          <button type="button" className="btn btn--ghost" onClick={() => inputRef.current?.click()}>
            Replace
          </button>
          {input}
        </div>
      ) : (
        <label
          htmlFor={id}
          className={`dropzone${over ? ' dropzone--over' : ''}${disabled ? ' dropzone--disabled' : ''}`}
          aria-invalid={!!rejected}
          aria-labelledby={`${id}-label`}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            if (!disabled) take(e.dataTransfer.files?.[0]);
          }}
        >
          <Upload size={28} style={{ color: 'var(--navy)' }} />
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Drop your resume here, or browse</span>
          <span className="t-fine">{disabled ? 'Sign in with LinkedIn first · PDF or DOCX' : 'PDF or DOCX'}</span>
          {input}
        </label>
      )}

      <span id={`${id}-msg`} className="field__msg field__msg--error" role={rejected ? 'alert' : undefined}>
        {rejected ? `“${rejected}” isn’t supported. Upload a PDF or DOCX file.` : ''}
      </span>
    </div>
  );
}
