import type { InterviewStage, MatchStatus } from '@/lib/types';

/** Exactly three employer-chosen branches after a match (slide 6). Candidate side renders received state. */
export function StatusChip({ status }: { status: MatchStatus }) {
  const label =
    status.state === 'awaiting'
      ? 'Awaiting employer'
      : status.state === 'pass'
        ? 'Closed'
        : status.state === 'trial'
          ? 'Paid trial offered'
          : `Interviewing · ${status.stage}`;
  return (
    <span className={`status status--${status.state}`}>
      <span className="status__dot" />
      {label}
    </span>
  );
}

const STAGES: InterviewStage[] = ['screen', 'panel', 'offer'];

export function InterviewStages({ current }: { current: InterviewStage }) {
  const at = STAGES.indexOf(current);
  return (
    <ol className="stages" aria-label="Interview stages">
      {STAGES.map((s, i) => (
        <li
          key={s}
          className={`stages__item${i < at ? ' stages__item--done' : i === at ? ' stages__item--current' : ''}`}
          aria-current={i === at ? 'step' : undefined}
        >
          {s[0].toUpperCase() + s.slice(1)}
        </li>
      ))}
    </ol>
  );
}
