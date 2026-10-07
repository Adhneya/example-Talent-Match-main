'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  REVIEW_CANDIDATES,
  MATCHED_CANDIDATES,
  TRIAL_OFFER,
  type ReviewCandidate,
  type MatchedCandidate,
  type Skill,
  type TrialStatus,
} from '@/lib/candidates';
import { Heart, Cross } from '@/components/Icons';
import ChatModal from '@/components/ChatModal';
import { useChat } from '@/hooks/useChat';

type Tab = 'review' | 'matches' | 'trials';

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('review');
  const [review, setReview] = useState<ReviewCandidate[]>(REVIEW_CANDIDATES);
  const [matches, setMatches] = useState<MatchedCandidate[]>(MATCHED_CANDIDATES);
  const [toast, setToast] = useState<string | null>(null);
  const [profile, setProfile] = useState<ReviewCandidate | null>(null);
  const { peer, messages, openChat, closeChat, send } = useChat();

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2400);
  }

  // Reload the review queue (brings back passed candidates not yet matched).
  function refresh() {
    setReview(REVIEW_CANDIDATES.filter((c) => !matches.some((m) => m.id === c.id)));
    flash('Refreshed — candidates reloaded');
  }

  function pass(id: string) {
    setReview((r) => r.filter((c) => c.id !== id));
  }

  function match(c: ReviewCandidate) {
    setReview((r) => r.filter((x) => x.id !== c.id));
    setMatches((m) => [{ id: c.id, name: c.name, tagline: c.tagline, trial: 'none' }, ...m]);
    setProfile(null);
    flash(`Matched with ${c.name}`);
  }

  function sendInvite(id: string, name: string) {
    setMatches((m) => m.map((c) => (c.id === id ? { ...c, trial: 'pending' } : c)));
    flash(`Trial invite sent to ${name}`);
  }

  // Hierarchy: strongest matches first.
  const sortedReview = useMemo(() => [...review].sort((a, b) => b.skillsMatch - a.skillsMatch), [review]);

  const stats = useMemo(
    () => ({
      interested: review.length,
      matched: matches.length,
      activeTrials: matches.filter((m) => m.trial === 'accepted').length,
    }),
    [review, matches],
  );

  const trials = matches.filter((m) => m.trial !== 'none');

  return (
    <main className="wrap" style={{ paddingBottom: 120 }}>
      <section className="col" style={{ maxWidth: 600, padding: '14px 0 40px' }}>
        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="t-h1">Company Dashboard</h1>
            <p className="t-body t-muted" style={{ marginTop: 8, maxWidth: '34ch' }}>
              Review interested candidates, match, and invite them to a trial.
            </p>
          </div>
          <button className="btn btn--ghost" onClick={refresh}>
            Refresh
          </button>
        </div>

        {/* Stats — uniform weight */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 26 }}>
          <Stat label="Interested" value={stats.interested} />
          <Stat label="Matched" value={stats.matched} />
          <Stat label="Active Trials" value={stats.activeTrials} />
        </div>

        {/* Tab body */}
        <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {tab === 'review' &&
            (sortedReview.length ? (
              sortedReview.map((c) => (
                <ReviewCard
                  key={c.id}
                  c={c}
                  onPass={() => pass(c.id)}
                  onMatch={() => match(c)}
                  onView={() => setProfile(c)}
                />
              ))
            ) : (
              <Empty title="No more candidates to review." sub="Check the Matches tab to keep things moving." />
            ))}

          {tab === 'matches' &&
            (matches.length ? (
              matches.map((c) => (
                <MatchCard
                  key={c.id}
                  c={c}
                  onChat={() => openChat({ id: c.id, name: c.name, subtitle: c.tagline })}
                  onInvite={() => sendInvite(c.id, c.name)}
                />
              ))
            ) : (
              <Empty title="No matches yet." sub="Match a candidate in the Review tab to begin." />
            ))}

          {tab === 'trials' &&
            (trials.length ? (
              trials.map((c) => (
                <TrialCard key={c.id} c={c} onChat={() => openChat({ id: c.id, name: c.name, subtitle: c.tagline })} />
              ))
            ) : (
              <Empty title="No active trials." sub="Send a trial invite from the Matches tab." />
            ))}
        </div>
      </section>

      {profile && <ProfileDrawer c={profile} onClose={() => setProfile(null)} onMatch={() => match(profile)} />}

      <ChatModal peer={peer} messages={messages} onSend={send} onClose={closeChat} />

      {toast && (
        <div
          role="status"
          style={{
            position: 'fixed',
            bottom: 86,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 70,
            background: 'var(--ink)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: '0.9rem',
            fontWeight: 500,
            boxShadow: '0 12px 30px -12px rgba(26,26,26,0.5)',
          }}
        >
          {toast}
        </div>
      )}

      <BottomNav tab={tab} setTab={setTab} />
    </main>
  );
}

/* ── Stats ──────────────────────────────────────────────────── */
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ padding: '16px 18px', borderRadius: 16, boxShadow: 'none' }}>
      <div className="t-label">{label}</div>
      <div style={{ marginTop: 4, fontSize: '1.7rem', fontWeight: 700 }}>{value}</div>
    </div>
  );
}

/* ── Review card ────────────────────────────────────────────── */
function ReviewCard({
  c,
  onPass,
  onMatch,
  onView,
}: {
  c: ReviewCandidate;
  onPass: () => void;
  onMatch: () => void;
  onView: () => void;
}) {
  const top = c.skillsMatch >= 70;
  return (
    <div className="card" style={{ padding: '24px 26px 22px', borderColor: top ? 'var(--accent-line)' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          {top && (
            <span className="pill pill--match" style={{ fontSize: '0.74rem', padding: '4px 10px', marginBottom: 10 }}>
              Top match
            </span>
          )}
          <h3 className="t-h3">{c.name}</h3>
          <p className="t-body t-muted" style={{ marginTop: 6, maxWidth: '34ch' }}>
            {c.tagline}
          </p>
        </div>
        <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.2 }}>
            Skills
            <br />
            match
          </div>
          <div style={{ marginTop: 4, fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-ink)' }}>{c.skillsMatch}%</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: '14px 16px',
          borderRadius: 12,
          background: 'var(--accent-tint)',
          border: '1px solid var(--accent-line)',
        }}
      >
        <p className="t-body" style={{ fontSize: '0.94rem' }}>
          <strong style={{ fontWeight: 700 }}>Why interested:</strong> {c.whyInterested}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 18 }}>
        {c.skills.map((s) => (
          <SkillTag key={s.label} skill={s} />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        <button className="link-accent" onClick={onView}>
          View Profile →
        </button>
        <span className="t-fine" style={{ color: 'var(--faint)' }}>
          No invite sent
        </span>
      </div>

      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn btn--neutral" onClick={onPass}>
          Pass
        </button>
        <button className="btn btn--primary" onClick={onMatch}>
          <Heart size={16} /> Match
        </button>
      </div>
    </div>
  );
}

function SkillTag({ skill }: { skill: Skill }) {
  return <span className={skill.matched ? 'pill pill--match' : 'pill'}>{skill.label}</span>;
}

function StatusChip({ status, prefix = '' }: { status: TrialStatus; prefix?: string }) {
  const label = status === 'none' ? 'no invite' : status;
  return (
    <span className={`status status--${status}`}>
      <span className="status__dot" />
      {prefix}
      {label}
    </span>
  );
}

/* ── Match card ─────────────────────────────────────────────── */
function MatchCard({ c, onChat, onInvite }: { c: MatchedCandidate; onChat: () => void; onInvite: () => void }) {
  const invited = c.trial !== 'none';
  return (
    <div className="card" style={{ padding: '24px 26px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h3 className="t-h3">{c.name}</h3>
          <p className="t-body t-muted" style={{ marginTop: 6, maxWidth: '30ch' }}>
            {c.tagline}
          </p>
        </div>
        {invited && <StatusChip status={c.trial} prefix="Trial: " />}
      </div>

      <div className="btn-row" style={{ marginTop: 20 }}>
        <button className="btn" onClick={onChat}>
          Open Chat
        </button>
        <button
          className="btn btn--primary"
          onClick={onInvite}
          aria-disabled={c.trial === 'accepted'}
          style={c.trial === 'accepted' ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
        >
          Send Trial Invite
        </button>
      </div>
    </div>
  );
}

/* ── Trial card ─────────────────────────────────────────────── */
function TrialCard({ c, onChat }: { c: MatchedCandidate; onChat: () => void }) {
  return (
    <div className="card" style={{ padding: '24px 26px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
        <div>
          <h3 className="t-h3" style={{ maxWidth: '20ch' }}>
            {TRIAL_OFFER.title}
          </h3>
          <p className="t-body t-muted" style={{ marginTop: 8 }}>
            {TRIAL_OFFER.terms}
          </p>
          <p className="t-body t-muted" style={{ marginTop: 14 }}>
            Candidate: {c.name}
          </p>
        </div>
        <StatusChip status={c.trial} />
      </div>

      <button className="btn btn--block" style={{ marginTop: 18 }} onClick={onChat}>
        Open Chat
      </button>
    </div>
  );
}

/* ── Profile drawer (replaces the window.alert dead-end) ─────── */
function ProfileDrawer({ c, onClose, onMatch }: { c: ReviewCandidate; onClose: () => void; onMatch: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        background: 'rgba(26,26,26,0.28)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${c.name} profile`}
        style={{
          width: 'min(440px, 92vw)',
          height: '100%',
          background: 'var(--surface)',
          borderLeft: '1px solid var(--hairline)',
          boxShadow: '-30px 0 80px -40px rgba(26,26,26,0.5)',
          padding: '28px 30px',
          overflowY: 'auto',
          animation: 'revealUp 0.3s ease both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span className="t-label">Candidate profile</span>
          <button className="btn btn--ghost" aria-label="Close" onClick={onClose} style={{ padding: 4 }}>
            <Cross size={18} />
          </button>
        </div>

        <h2 className="t-h2" style={{ marginTop: 18 }}>
          {c.name}
        </h2>
        <p className="t-body t-muted" style={{ marginTop: 6 }}>
          {c.tagline}
        </p>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 18 }}>
          <span style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--accent-ink)' }}>{c.skillsMatch}%</span>
          <span className="t-fine">skills match</span>
        </div>

        <p className="t-label" style={{ marginTop: 24 }}>
          Why interested
        </p>
        <p className="t-body" style={{ marginTop: 8 }}>
          {c.whyInterested}
        </p>

        <p className="t-label" style={{ marginTop: 24 }}>
          Skills
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 10 }}>
          {c.skills.map((s) => (
            <SkillTag key={s.label} skill={s} />
          ))}
        </div>

        <div className="btn-row" style={{ marginTop: 32 }}>
          <button className="btn btn--neutral" onClick={onClose}>
            Close
          </button>
          <button className="btn btn--primary" onClick={onMatch}>
            <Heart size={16} /> Match
          </button>
        </div>
      </aside>
    </div>
  );
}

function Empty({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="card" style={{ padding: '44px 30px', textAlign: 'center' }}>
      <h3 className="t-h2">{title}</h3>
      <p className="t-body t-muted" style={{ marginTop: 10 }}>
        {sub}
      </p>
    </div>
  );
}

/* ── Bottom nav ─────────────────────────────────────────────── */
function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items: { key: Tab; label: string }[] = [
    { key: 'review', label: 'Review' },
    { key: 'matches', label: 'Matches' },
    { key: 'trials', label: 'Trials' },
  ];
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid var(--hairline)',
        display: 'flex',
        justifyContent: 'center',
        gap: 70,
        padding: '16px 0 calc(env(safe-area-inset-bottom, 0px) + 18px)',
      }}
    >
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => setTab(it.key)}
          style={{
            background: 'transparent',
            border: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: tab === it.key ? 'var(--accent-ink)' : 'var(--muted)',
          }}
        >
          {it.label}
        </button>
      ))}
    </nav>
  );
}
