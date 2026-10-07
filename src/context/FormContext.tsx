'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Role = 'pm' | 'hiring';

export interface FormState {
  role: Role;
  email: string;
  isDemo: boolean;
  name: string;
  oneLiner: string;
  skills: string[];
  liked: string[]; // company ids the user swiped right on
  passed: string[]; // company ids the user passed
}

const EMPTY: FormState = {
  role: 'pm',
  email: '',
  isDemo: false,
  name: '',
  oneLiner: '',
  skills: [],
  liked: [],
  passed: [],
};

interface FormContextValue extends FormState {
  update: (patch: Partial<FormState>) => void;
  toggleSkill: (skill: string, max?: number) => void;
  reset: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

const STORAGE_KEY = 'talentmatch.form';

export function FormProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FormState>(EMPTY);

  // Hydrate from localStorage so progress survives a page refresh.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota / privacy-mode errors */
    }
  }, [state]);

  const value = useMemo<FormContextValue>(
    () => ({
      ...state,
      update: (patch) => setState((s) => ({ ...s, ...patch })),
      toggleSkill: (skill, max = 3) =>
        setState((s) => {
          const has = s.skills.includes(skill);
          if (has) return { ...s, skills: s.skills.filter((x) => x !== skill) };
          if (s.skills.length >= max) return s; // cap reached
          return { ...s, skills: [...s.skills, skill] };
        }),
      reset: () => {
        setState(EMPTY);
        try {
          window.localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      },
    }),
    [state],
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useForm() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useForm must be used within a FormProvider');
  return ctx;
}
