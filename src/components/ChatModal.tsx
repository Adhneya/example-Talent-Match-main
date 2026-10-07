'use client';

import { useEffect, useRef, useState } from 'react';
import { Cross, Arrow } from '@/components/Icons';
import type { ChatMessage, ChatPeer } from '@/hooks/useChat';

export default function ChatModal({
  peer,
  messages,
  onSend,
  onClose,
}: {
  peer: ChatPeer | null;
  messages: ChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (peer) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [peer, onClose]);

  if (!peer) return null;

  function submit() {
    onSend(text);
    setText('');
  }

  return (
    <div
      className="chat-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="chat" role="dialog" aria-modal="true" aria-label={`Chat with ${peer.name}`}>
        <div className="chat__head">
          <div style={{ minWidth: 0 }}>
            <div className="t-h4" style={{ fontSize: '1.1rem', lineHeight: 1.1 }}>
              {peer.name}
            </div>
            {peer.subtitle && (
              <div className="t-fine" style={{ marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {peer.subtitle}
              </div>
            )}
          </div>
          <button className="btn btn--ghost" aria-label="Close chat" onClick={onClose} style={{ padding: 4 }}>
            <Cross size={18} />
          </button>
        </div>

        <div className="chat__body">
          {messages.map((m) => (
            <div key={m.id} className={`chat__msg chat__msg--${m.from}`}>
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form
          className="chat__foot"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <input
            className="chat__input"
            placeholder="Write a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn--primary chat__send" aria-label="Send" disabled={!text.trim()}>
            <Arrow size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
