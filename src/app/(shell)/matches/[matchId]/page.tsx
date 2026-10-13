'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useStore } from '@/store/AppStore';
import { getRole, matchStatus } from '@/lib/api';
import { useNow } from '@/hooks/useNotifications';
import { RoleCardStatic } from '@/components/RoleCard';
import { InterviewStages, StatusChip } from '@/components/EngagementStatus';

/**
 * S-10 Match detail — the employer-chosen branch and its status (slide 6).
 * Read-only until the employer acts. Trial depth is gated by open decision 5;
 * the candidate view of an employer pass is a GAP in the deck (copy below is
 * a proposal).
 */
export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { matches, respondToTrial } = useStore();
  const now = useNow();
  const match = matches.find((m) => m.id === matchId);
  const role = match ? getRole(match.roleId) : undefined;

  if (!match || !role) {
    return (
      <section className="col page">
        <h1 className="t-h2">Match not found</h1>
        <Link href="/matches" className="link" style={{ display: 'inline-block', marginTop: 12 }}>
          Back to matches
        </Link>
      </section>
    );
  }

  const status = matchStatus(match, now);

  return (
    <section className="col page">
      <Link href="/matches" className="link">
        ← Matches
      </Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <h1 className="t-h2">{role.company.name}</h1>
        <StatusChip status={status} />
      </div>

      <RoleCardStatic role={role} />

      <div className="card" style={{ marginTop: 18, padding: '22px 22px 24px' }} aria-live="polite">
        {status.state === 'awaiting' && (
          <>
            <h2 className="t-h3">Waiting on {role.company.name}</h2>
            <p className="t-body t-muted" style={{ marginTop: 8 }}>
              They’ll choose the next step: a three-week paid trial or a standard interview track. There’s nothing you
              need to do yet — we’ll notify you when they decide.
            </p>
          </>
        )}

        {status.state === 'pass' && (
          <>
            <h2 className="t-h3">{role.company.name} won’t be moving forward</h2>
            <p className="t-body t-muted" style={{ marginTop: 8 }}>
              They’ve closed this match, so there won’t be further contact about this role. It doesn’t affect the rest of
              your deck.
            </p>
            <Link href="/swipe" className="btn btn--primary btn--lg" style={{ marginTop: 18 }}>
              Back to swiping
            </Link>
          </>
        )}

        {status.state === 'trial' && (
          <>
            <h2 className="t-h3">Paid trial offered</h2>
            <p className="t-body t-muted" style={{ marginTop: 8 }}>
              A three-week, internship-style engagement to test fit both ways before anyone commits.
            </p>
            <p style={{ marginTop: 12, fontWeight: 600, color: 'var(--navy)' }}>{status.terms}</p>
            {match.trialResponse ? (
              <p className="field__msg field__msg--ok" style={{ marginTop: 16 }}>
                {match.trialResponse === 'accepted'
                  ? `You accepted. ${role.company.name} will be in touch with start details.`
                  : 'You declined this trial.'}
              </p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 18 }}>
                <button className="btn btn--lg" onClick={() => respondToTrial(match.id, 'declined')}>
                  Decline
                </button>
                <button className="btn btn--primary btn--lg" onClick={() => respondToTrial(match.id, 'accepted')}>
                  Accept trial
                </button>
              </div>
            )}
          </>
        )}

        {status.state === 'interview' && (
          <>
            <h2 className="t-h3">Interview track</h2>
            <p className="t-body t-muted" style={{ marginTop: 8, marginBottom: 16 }}>
              The standard hiring stages. {role.company.name} will schedule each one with you.
            </p>
            <InterviewStages current={status.stage} />
          </>
        )}
      </div>
    </section>
  );
}
