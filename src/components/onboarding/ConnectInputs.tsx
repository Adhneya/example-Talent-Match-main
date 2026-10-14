'use client';

import { useId, useRef, useState } from 'react';
import { Doc, Tick, Upload } from '@/components/Icons';
import { track } from '@/lib/analytics';

/* ── LinkedIn URL ──────────────────────────────────────────────── */

const LINKEDIN = /^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([A-Za-z0-9\-_%]{3,100})\/?(?:[?#].*)?$/i;

/** Returns the canonical profile URL, or null if the input isn't a LinkedIn profile link. */
export function normalizeLinkedIn(raw: string): string | null {
  const m = raw.trim().match(LINKEDIN);
  return m ? `https://www.linkedin.com/in/${m[1]}` : null;
}

export function LinkedInUrlField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const valid = normalizeLinkedIn(value) !== null;
  const showError = touched && value.trim() !== '' && !valid;

  return (
    <div className="field">
      <label htmlFor={id}>LinkedIn profile URL</label>
      <input
        id={id}
        className="input"
        type="text" // not "url": native validation would reject links pasted without https://
        inputMode="url"
        autoComplete="url"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="linkedin.com/in/your-name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        aria-invalid={showError}
        aria-describedby={`${id}-msg`}
      />
      <span id={`${id}-msg`} className={`field__msg ${showError ? 'field__msg--error' : valid ? 'field__msg--ok' : 't-fine'}`}>
        {showError
          ? 'Paste the link to your profile — it looks like linkedin.com/in/your-name.'
          : valid
            ? 'Profile link looks good.'
            : 'Paste it straight from your browser’s address bar.'}
      </span>
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
}: {
  value: { name: string; size: number } | null;
  onChange: (v: { name: string; size: number } | null) => void;
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
          className={`dropzone${over ? ' dropzone--over' : ''}`}
          aria-invalid={!!rejected}
          aria-labelledby={`${id}-label`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            take(e.dataTransfer.files?.[0]);
          }}
        >
          <Upload size={28} style={{ color: 'var(--navy)' }} />
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>Drop your resume here, or browse</span>
          <span className="t-fine">PDF or DOCX</span>
          {input}
        </label>
      )}

      <span id={`${id}-msg`} className="field__msg field__msg--error" role={rejected ? 'alert' : undefined}>
        {rejected ? `“${rejected}” isn’t supported. Upload a PDF or DOCX file.` : ''}
      </span>
    </div>
  );
}
