'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { WelcomeState } from '@/components/chat/WelcomeState';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { sendChatMessage } from '@/lib/api';
import { Sparkles, Plus, History, X, Trash2, Clock } from 'lucide-react';

// ── localStorage session management ─────────────────────────────────────────

const STORAGE_KEY = 'afyapack_chat_sessions';
const MAX_SESSIONS = 20;

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)));
  } catch { /* storage full */ }
}

function sessionTitle(messages) {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'New conversation';
  return first.content.slice(0, 50) + (first.content.length > 50 ? '…' : '');
}

function formatTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ── Main page ────────────────────────────────────────────────────────────────

function ChatPageInner() {
  const searchParams = useSearchParams();
  const { modelReady } = useSystemStatus();
  const [messages, setMessages] = useState([]);
  const [sessionId, setSessionId] = useState(() => Date.now().toString());
  const [loading, setLoading] = useState(false);
  const [citations, setCitations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Load sessions on mount
  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  // Auto-send from URL query param (dashboard quick prompts)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && messages.length === 0) {
      sendMessage(q, []);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, []);

  // Persist current session to localStorage whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    const updated = {
      id: sessionId,
      title: sessionTitle(messages),
      messages,
      updatedAt: Date.now(),
    };
    const existing = loadSessions();
    const idx = existing.findIndex(s => s.id === sessionId);
    if (idx >= 0) {
      existing[idx] = updated;
    } else {
      existing.unshift(updated);
    }
    saveSessions(existing);
    setSessions(existing);
  }, [messages, sessionId]);

  async function sendMessage(text, attachments = []) {
    if ((!text.trim() && !attachments?.length) || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      attachments: attachments || [],
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    scrollToBottom();

    try {
      // Build history without attachment data (keep it lean for context)
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      // Strip dataUrls from attachments before sending to API (keep name + content only)
      const apiAttachments = (attachments || []).map(({ name, type, content }) => ({ name, type, content }));
      const result = await sendChatMessage(text.trim(), history, apiAttachments);

      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: result.reply,
        citations: result.citations || [],
        escalation: result.escalation_needed || false,
        tool_used: result.tool_used || null,
        language: result.language || 'en',
      };
      setMessages(prev => [...prev, aiMsg]);
      if (result.citations?.length) setCitations(result.citations);
    } catch (err) {
      const errMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Sorry, I couldn't process that request. ${err.message}`,
        isError: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  function handleQuickPrompt(prompt) {
    sendMessage(prompt, []);
  }

  function startNewChat() {
    setMessages([]);
    setCitations([]);
    setSessionId(Date.now().toString());
    setShowHistory(false);
  }

  function loadSession(session) {
    setMessages(session.messages);
    setSessionId(session.id);
    setCitations([]);
    setShowHistory(false);
    scrollToBottom();
  }

  function deleteSession(id, e) {
    e.stopPropagation();
    const updated = loadSessions().filter(s => s.id !== id);
    saveSessions(updated);
    setSessions(updated);
    if (id === sessionId) startNewChat();
  }

  return (
    <AppShell rightPanel={<RightPanel citations={citations} />} fullHeight>
      <div className="flex flex-col h-full min-h-0 relative">

        {/* Header bar */}
        <div className="shrink-0 flex items-center gap-3 px-5 py-3.5 border-b border-border bg-white/80 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-foreground leading-none">AfyaPack AI</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {modelReady ? 'Local AI · Protocol-grounded' : 'AI not loaded'}
            </div>
          </div>

          {/* New chat button */}
          <button
            onClick={startNewChat}
            title="New chat"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Plus size={16} />
          </button>

          {/* History button */}
          <button
            onClick={() => setShowHistory(v => !v)}
            title="Chat history"
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
              showHistory ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            <History size={16} />
          </button>

          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${modelReady ? 'bg-emerald-400 animate-pulse-soft' : 'bg-primary animate-pulse-soft'}`} />
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

            {messages.length === 0 ? (
              <WelcomeState onPrompt={handleQuickPrompt} />
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <ChatMessage key={msg.id} message={msg} index={i} />
                ))}
              </AnimatePresence>
            )}

            {/* Typing indicator */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles size={14} className="text-primary" />
                </div>
                <div className="chat-message-ai flex items-center gap-1 py-3 px-4">
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-1" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-2" />
                  <span className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-3" />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <ChatComposer
          onSend={sendMessage}
          loading={loading}
          inputRef={inputRef}
        />

        {/* History drawer */}
        <AnimatePresence>
          {showHistory && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="absolute inset-0 bg-black/20 z-10"
              />
              {/* Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="absolute right-0 top-0 bottom-0 w-72 bg-white border-l border-border shadow-xl z-20 flex flex-col"
              >
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
                  <History size={15} className="text-primary" />
                  <span className="text-sm font-bold text-foreground flex-1">Chat History</span>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* New chat CTA */}
                <button
                  onClick={startNewChat}
                  className="flex items-center gap-2.5 mx-3 mt-3 mb-2 p-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary-light transition-colors"
                >
                  <Plus size={14} />
                  <span className="text-sm font-semibold">New conversation</span>
                </button>

                {/* Session list */}
                <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
                  {sessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No past conversations yet</p>
                  ) : (
                    sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => loadSession(session)}
                        className={`w-full text-left flex items-start gap-2.5 p-3 rounded-xl group hover:bg-secondary transition-colors ${
                          session.id === sessionId ? 'bg-primary-light border border-primary/20' : ''
                        }`}
                      >
                        <Clock size={12} className="text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{session.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatTime(session.updatedAt)} · {session.messages.length} messages
                          </p>
                        </div>
                        <button
                          onClick={(e) => deleteSession(session.id, e)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 text-muted-foreground transition-all shrink-0"
                        >
                          <Trash2 size={11} />
                        </button>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}
