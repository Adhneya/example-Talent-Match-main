import type { EngagementPath, Role } from '../types';

/**
 * Sample inventory. Aggregated roles seed the Phase 0 deck (slide 8, step 1):
 * US-first, posted within the last 30 days. Companies are fictional and every
 * apply-out link points at example.com.
 */
export const AGGREGATED_ROLES: Role[] = [
  {
    id: 'r-acme-pm',
    family: 'product',
    company: { name: 'Acme Freight', stage: 'Series B', sector: 'Logistics', location: 'San Francisco, CA' },
    title: 'Senior Product Manager, Shipper Platform',
    summary: 'Own the self-serve booking flow used by 4,000 mid-market shippers.',
    pay: { min: 165000, max: 195000, currency: 'USD', period: 'year' },
    postedDaysAgo: 3,
    about: [
      'You will lead a pod of six engineers and a designer focused on quoting, booking and tracking.',
      'The team ships weekly and owns its own metrics: activation, booking conversion and repeat rate.',
    ],
    keywords: ['roadmapping', 'b2b', 'marketplace', 'user research', 'sql'],
    source: { kind: 'aggregated', name: 'Greenhouse', applyUrl: 'https://example.com/jobs/acme-freight-spm' },
  },
  {
    id: 'r-northwind-pm',
    family: 'product',
    company: { name: 'Northwind Labs', stage: 'Seed', sector: 'Developer tools', location: 'Remote (US)' },
    title: 'Founding Product Manager',
    summary: 'First PM hire — shape onboarding and activation for an API-first product.',
    pay: { min: 150000, max: 180000, currency: 'USD', period: 'year' },
    postedDaysAgo: 6,
    about: [
      'Work directly with the founders to turn early usage into a repeatable activation funnel.',
      'Expect to run discovery calls every week and write the specs engineering builds from.',
    ],
    keywords: ['api', 'developer', 'activation', 'experimentation', 'technical'],
    source: { kind: 'aggregated', name: 'Lever', applyUrl: 'https://example.com/jobs/northwind-founding-pm' },
  },
  {
    id: 'r-cadence-pm',
    family: 'product',
    company: { name: 'Cadence', stage: 'Series C', sector: 'Productivity', location: 'New York, NY' },
    title: 'Product Manager, Calendar Reliability',
    summary: 'Make calendar sync boringly reliable for 2M weekly users.',
    pay: { min: 155000, max: 185000, currency: 'USD', period: 'year' },
    postedDaysAgo: 9,
    about: [
      'Map failure modes across Google, Microsoft and iCloud integrations and drive a prioritized fix plan.',
      'Partner closely with support and infrastructure; you will own the reliability scorecard.',
    ],
    keywords: ['reliability', 'integrations', 'stakeholder management', 'data analysis'],
    source: { kind: 'aggregated', name: 'Ashby', applyUrl: 'https://example.com/jobs/cadence-pm-reliability' },
  },
  {
    id: 'r-meridian-pm',
    family: 'product',
    company: { name: 'Meridian Climate', stage: 'Series A', sector: 'Climate data', location: 'Austin, TX' },
    title: 'Product Manager, Analytics',
    summary: 'Ship the v2 analytics dashboard for enterprise sustainability teams.',
    pay: null, // listing omits a band — exercises the missing-pay state
    postedDaysAgo: 12,
    about: [
      'Run discovery with enterprise users, define success metrics and own the dashboard roadmap.',
      'You will work with a data engineering team of four and a part-time designer.',
    ],
    keywords: ['analytics', 'b2b', 'data analysis', 'user research', 'roadmapping'],
    source: { kind: 'aggregated', name: 'Greenhouse', applyUrl: 'https://example.com/jobs/meridian-pm-analytics' },
  },
  {
    id: 'r-ledgerly-pm',
    family: 'product',
    company: { name: 'Ledgerly', stage: 'Series C', sector: 'Fintech', location: 'Remote (US)' },
    title: 'Senior Product Manager, Payments',
    summary: 'Lead card issuing and usage-based billing for SMB finance teams.',
    pay: { min: 175000, max: 210000, currency: 'USD', period: 'year' },
    postedDaysAgo: 2,
    about: [
      'Own the payments roadmap end to end, from issuing partners to the in-product billing experience.',
      'Strong preference for candidates who have shipped regulated financial products.',
    ],
    keywords: ['payments', 'fintech', 'billing', 'b2b', 'strategy'],
    source: { kind: 'aggregated', name: 'Lever', applyUrl: 'https://example.com/jobs/ledgerly-spm-payments' },
  },
  {
    id: 'r-harbor-pm',
    family: 'product',
    company: { name: 'Harbor Health', stage: 'Series B', sector: 'Healthcare', location: 'Boston, MA' },
    title: 'Product Manager, Patient Experience',
    summary: 'Cut appointment no-shows with better reminders and rescheduling.',
    pay: { min: 140000, max: 165000, currency: 'USD', period: 'year' },
    postedDaysAgo: 15,
    about: [
      'Own the patient-facing mobile app across scheduling, reminders and check-in.',
      'Work alongside clinical operations to translate workflows into product requirements.',
    ],
    keywords: ['mobile', 'healthcare', 'user research', 'a/b testing'],
    source: { kind: 'aggregated', name: 'Ashby', applyUrl: 'https://example.com/jobs/harbor-pm-patient' },
  },
  {
    id: 'r-tandem-pm',
    family: 'product',
    company: { name: 'Tandem', stage: 'Series A', sector: 'HR tech', location: 'Chicago, IL' },
    title: 'Product Manager, Growth',
    summary: 'Run the experiment program behind trial-to-paid conversion.',
    pay: { min: 135000, max: 160000, currency: 'USD', period: 'year' },
    postedDaysAgo: 20,
    about: [
      'Design, launch and read out experiments across signup, onboarding and pricing pages.',
      'You will set the experimentation standards for the whole product org.',
    ],
    keywords: ['growth', 'a/b testing', 'experimentation', 'sql', 'data analysis'],
    source: { kind: 'aggregated', name: 'Greenhouse', applyUrl: 'https://example.com/jobs/tandem-pm-growth' },
  },
  {
    id: 'r-orbit-pm',
    family: 'product',
    company: { name: 'Orbit Retail', stage: 'Public', sector: 'E-commerce', location: 'Seattle, WA' },
    title: 'Principal Product Manager, Search',
    summary: 'Own search relevance and merchandising for a 30M-SKU catalog.',
    pay: { min: 210000, max: 255000, currency: 'USD', period: 'year' },
    postedDaysAgo: 27,
    about: [
      'Set strategy for search ranking, query understanding and merchandising tools.',
      'Partner with applied science on ranking models and with merchants on controls.',
    ],
    keywords: ['search', 'ml', 'strategy', 'e-commerce', 'technical'],
    source: { kind: 'aggregated', name: 'Workday', applyUrl: 'https://example.com/jobs/orbit-ppm-search' },
  },
  {
    id: 'r-pine-design',
    family: 'design',
    company: { name: 'Pine & Co', stage: 'Series A', sector: 'Consumer', location: 'Los Angeles, CA' },
    title: 'Senior Product Designer',
    summary: 'Design the core booking experience for a wellness marketplace.',
    pay: { min: 140000, max: 170000, currency: 'USD', period: 'year' },
    postedDaysAgo: 5,
    about: ['End-to-end ownership of booking, from discovery to post-visit reviews.'],
    keywords: ['figma', 'user research', 'prototyping', 'marketplace'],
    source: { kind: 'aggregated', name: 'Lever', applyUrl: 'https://example.com/jobs/pine-senior-designer' },
  },
  {
    id: 'r-relay-eng',
    family: 'engineering',
    company: { name: 'Relay Systems', stage: 'Series B', sector: 'Infrastructure', location: 'Remote (US)' },
    title: 'Senior Software Engineer, Platform',
    summary: 'Build the event pipeline that moves 2B messages a day.',
    pay: { min: 180000, max: 220000, currency: 'USD', period: 'year' },
    postedDaysAgo: 8,
    about: ['Own reliability and throughput of the core event bus. Go and Kafka experience preferred.'],
    keywords: ['technical', 'infrastructure', 'go', 'kafka'],
    source: { kind: 'aggregated', name: 'Greenhouse', applyUrl: 'https://example.com/jobs/relay-sse-platform' },
  },
  {
    id: 'r-quarry-data',
    family: 'data',
    company: { name: 'Quarry', stage: 'Series B', sector: 'Analytics', location: 'Denver, CO' },
    title: 'Senior Data Analyst, Product',
    summary: 'Be the analytics partner to three product teams.',
    pay: { min: 125000, max: 150000, currency: 'USD', period: 'year' },
    postedDaysAgo: 11,
    about: ['Define metrics, build dashboards and read out experiments with PMs.'],
    keywords: ['sql', 'data analysis', 'a/b testing', 'analytics'],
    source: { kind: 'aggregated', name: 'Ashby', applyUrl: 'https://example.com/jobs/quarry-sda-product' },
  },
  {
    id: 'r-lumen-pmm',
    family: 'marketing',
    company: { name: 'Lumen AI', stage: 'Series A', sector: 'AI tooling', location: 'San Francisco, CA' },
    title: 'Product Marketing Manager',
    summary: 'Launch and position an AI assistant for support teams.',
    pay: { min: 140000, max: 165000, currency: 'USD', period: 'year' },
    postedDaysAgo: 4,
    about: ['Own positioning, launches and sales enablement for the core product.'],
    keywords: ['positioning', 'launch', 'strategy', 'b2b'],
    source: { kind: 'aggregated', name: 'Lever', applyUrl: 'https://example.com/jobs/lumen-pmm' },
  },
];

/**
 * Phase 1 native roles — real employer accounts that can swipe back.
 * `demoEmployer` stands in for the employer side so the candidate-facing
 * consequences (match, engagement status) can be exercised without a console.
 */
export interface DemoEmployer {
  likesCandidate: boolean;
  path: EngagementPath;
  trialTerms?: string;
}

export const NATIVE_ROLES: (Role & { demoEmployer: DemoEmployer })[] = [
  {
    id: 'n-fieldnote-pm',
    family: 'product',
    company: { name: 'Fieldnote', stage: 'Series A', sector: 'Research tools', location: 'Remote (US)' },
    title: 'Product Manager, Insights',
    summary: 'Turn customer interviews into searchable, shareable insight.',
    pay: { min: 150000, max: 175000, currency: 'USD', period: 'year' },
    postedDaysAgo: 1,
    about: ['Own the insights repository and the AI tagging that powers it.'],
    keywords: ['user research', 'b2b', 'roadmapping', 'ai'],
    source: { kind: 'native', employerId: 'emp-fieldnote' },
    demoEmployer: { likesCandidate: true, path: 'trial', trialTerms: '3 weeks · paid · 20 hrs/week · remote' },
  },
  {
    id: 'n-bramble-pm',
    family: 'product',
    company: { name: 'Bramble', stage: 'Seed', sector: 'Fintech', location: 'New York, NY' },
    title: 'Senior Product Manager, Lending',
    summary: 'Build underwriting tools for community lenders.',
    pay: { min: 170000, max: 200000, currency: 'USD', period: 'year' },
    postedDaysAgo: 2,
    about: ['Lead the underwriting workflow from application intake to decision.'],
    keywords: ['fintech', 'b2b', 'strategy', 'data analysis'],
    source: { kind: 'native', employerId: 'emp-bramble' },
    demoEmployer: { likesCandidate: true, path: 'interview' },
  },
  {
    id: 'n-sundial-pm',
    family: 'product',
    company: { name: 'Sundial', stage: 'Series B', sector: 'Energy', location: 'Phoenix, AZ' },
    title: 'Product Manager, Home Energy',
    summary: 'Help homeowners understand and shift their energy use.',
    pay: { min: 140000, max: 165000, currency: 'USD', period: 'year' },
    postedDaysAgo: 3,
    about: ['Own the consumer app that pairs with smart meters and solar inverters.'],
    keywords: ['mobile', 'consumer', 'a/b testing', 'iot'],
    source: { kind: 'native', employerId: 'emp-sundial' },
    demoEmployer: { likesCandidate: true, path: 'pass' },
  },
];

export const TARGET_ROLES: { id: string; label: string; family: Role['family'] }[] = [
  { id: 'product-manager', label: 'Product Manager', family: 'product' },
  { id: 'product-designer', label: 'Product Designer', family: 'design' },
  { id: 'software-engineer', label: 'Software Engineer', family: 'engineering' },
  { id: 'data-analyst', label: 'Data Analyst', family: 'data' },
  { id: 'product-marketing', label: 'Product Marketing Manager', family: 'marketing' },
];
