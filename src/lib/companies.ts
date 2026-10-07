export interface Company {
  id: string;
  name: string;
  tagline: string;
  location: string;
  size: string;
  stage: string;
  trial: string;
  brief: string;
}

export const COMPANIES: Company[] = [
  {
    id: 'acme',
    name: 'Acme Corp',
    tagline: 'Building the future of logistics',
    location: 'San Francisco, CA',
    size: '50-200',
    stage: 'Series B',
    trial: '3-week trial • $4,500',
    brief:
      'Define MVP roadmap for our new B2B feature. Conduct 5 customer interviews, write problem statement, deliver prioritized roadmap.',
  },
  {
    id: 'northwind',
    name: 'Northwind Labs',
    tagline: 'Developer tools that feel invisible',
    location: 'Remote (US)',
    size: '11-50',
    stage: 'Seed',
    trial: '2-week trial • $3,200',
    brief:
      'Scope our self-serve onboarding. Audit the current funnel, propose 3 experiments, and ship a measurable activation bet.',
  },
  {
    id: 'cadence',
    name: 'Cadence',
    tagline: 'Calm scheduling for busy teams',
    location: 'New York, NY',
    size: '200-500',
    stage: 'Series C',
    trial: '4-week trial • $6,000',
    brief:
      'Own the calendar-sync reliability initiative. Map failure modes, align eng + support, deliver a prioritized fix plan.',
  },
  {
    id: 'meridian',
    name: 'Meridian',
    tagline: 'Climate data for everyone',
    location: 'Austin, TX',
    size: '50-200',
    stage: 'Series A',
    trial: '3-week trial • $4,800',
    brief:
      'Shape the v2 analytics dashboard. Run discovery with 4 enterprise users, define success metrics, hand off a spec.',
  },
];
