'use client';

import { useCallback, useState } from 'react';

export type ChatMessage = { id: string; from: 'me' | 'them'; text: string };
export type ChatPeer = { id: string; name: string; subtitle?: string };

const REPLIES = [
  'Thanks for reaching out — really excited about this one.',
  'Sounds great. When works for a quick intro call?',
  'I can scope the first week and share a plan by tomorrow.',
  'Appreciate it! Looking forward to the trial.',
];

/**
 * Lightweight in-session chat store. Threads persist while the page is
 * mounted (across tab switches); sending appends your message and triggers
 * a canned reply so the experience feels live in the demo.
 */
export function useChat() {
  const [peer, setPeer] = useState<ChatPeer | null>(null);
  const [threads, setThreads] = useState<Record<string, ChatMessage[]>>({});

  const openChat = useCallback((p: ChatPeer) => {
    setPeer(p);
    setThreads((t) =>
      t[p.id]
        ? t
        : {
            ...t,
            [p.id]: [
              { id: 'seed', from: 'them', text: `Hi! This is ${p.name}. Happy to talk through the trial.` },
            ],
          },
    );
  }, []);

  const closeChat = useCallback(() => setPeer(null), []);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!peer || !text) return;
      const id = peer.id;
      setThreads((t) => {
        const thread = t[id] || [];
        const next = [...thread, { id: `m${Date.now()}`, from: 'me' as const, text }];
        return { ...t, [id]: next };
      });
      const reply = REPLIES[(threads[id]?.length || 0) % REPLIES.length];
      window.setTimeout(() => {
        setThreads((t) => ({
          ...t,
          [id]: [...(t[id] || []), { id: `r${Date.now()}`, from: 'them' as const, text: reply }],
        }));
      }, 750);
    },
    [peer, threads],
  );

  const messages = peer ? threads[peer.id] || [] : [];
  return { peer, messages, openChat, closeChat, send };
}
