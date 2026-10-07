export interface Skill {
  label: string;
  matched: boolean; // matched against the company's needs (shown green)
}

export interface ReviewCandidate {
  id: string;
  name: string;
  tagline: string;
  skillsMatch: number; // percentage
  whyInterested: string;
  skills: Skill[];
}

export type TrialStatus = 'none' | 'pending' | 'accepted';

export interface MatchedCandidate {
  id: string;
  name: string;
  tagline: string;
  trial: TrialStatus;
}

export const REVIEW_CANDIDATES: ReviewCandidate[] = [
  {
    id: 'maya',
    name: 'Maya Patel',
    tagline: 'Former consultant → product • strong discovery chops',
    skillsMatch: 50,
    whyInterested:
      'Your culture line resonates — I’m pragmatic, collaborative, and biased to action.',
    skills: [
      { label: 'User Research', matched: true },
      { label: 'Strategy', matched: false },
      { label: 'Communication', matched: false },
      { label: 'Roadmapping', matched: true },
      { label: 'Figma', matched: false },
    ],
  },
  {
    id: 'sam',
    name: 'Sam Nguyen',
    tagline: 'Ex-founder • scrappy and user-obsessed',
    skillsMatch: 50,
    whyInterested:
      'I’ll talk to users daily and keep scope tight so you ship something real in weeks.',
    skills: [
      { label: 'User Research', matched: true },
      { label: 'Prototyping', matched: false },
      { label: 'Strategy', matched: false },
      { label: 'Roadmapping', matched: true },
      { label: 'Communication', matched: false },
    ],
  },
  {
    id: 'chris',
    name: 'Chris Walker',
    tagline: 'PM generalist • loves messy problems',
    skillsMatch: 75,
    whyInterested: 'I’m looking for a paid trial where I can prove impact quickly.',
    skills: [
      { label: 'User Research', matched: true },
      { label: 'Roadmapping', matched: true },
      { label: 'Agile', matched: true },
      { label: 'Communication', matched: false },
      { label: 'Stakeholder Management', matched: false },
    ],
  },
  {
    id: 'sofia',
    name: 'Sofia Martinez',
    tagline: 'B2B PM • API + platform experience',
    skillsMatch: 50,
    whyInterested:
      'I’m comfortable in ambiguous spaces and can partner closely with engineering.',
    skills: [
      { label: 'Technical', matched: false },
      { label: 'Roadmapping', matched: true },
      { label: 'Stakeholder Management', matched: false },
      { label: 'Agile', matched: true },
      { label: 'Data Analysis', matched: false },
    ],
  },
];

export const MATCHED_CANDIDATES: MatchedCandidate[] = [
  {
    id: 'alex',
    name: 'Alex Chen',
    tagline: 'PM @ fintech startup • loves shipping MVPs',
    trial: 'pending',
  },
  {
    id: 'jordan',
    name: 'Jordan Lee',
    tagline: 'Growth PM • experiments + funnels',
    trial: 'accepted',
  },
  {
    id: 'priya',
    name: 'Priya Kapoor',
    tagline: 'Data-driven PM • dashboards + insights',
    trial: 'pending',
  },
];

// Fixed trial offer used across the demo.
export const TRIAL_OFFER = {
  title: 'MVP Discovery + First Iteration',
  terms: '3 weeks • $4,500 • 15-20/wk',
};
