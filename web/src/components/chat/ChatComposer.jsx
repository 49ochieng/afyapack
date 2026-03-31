'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Square, AlertCircle, Paperclip, X, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatComposer({ onSend, loading, inputRef: externalRef }) {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [attachments, setAttachments] = useState([]); // [{ name, type, content, dataUrl }]
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  const ref = externalRef || textareaRef;

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    setSpeechSupported(!!SpeechRecognition);
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [text, ref]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    const msg = text.trim();
    if ((!msg && attachments.length === 0) || loading) return;
    const toSend = msg || (attachments.length > 0 ? `[Attached: ${attachments.map(a => a.name).join(', ')}]` : '');
    setText('');
    const sentAttachments = [...attachments];
    setAttachments([]);
    onSend(toSend, sentAttachments);
  }

  // ── File handling ────────────────────────────────────────────────────────

  function handleFileClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // reset so same file can be re-added
    if (!files.length) return;

    const processed = await Promise.all(files.map(readFile));
    setAttachments(prev => [...prev, ...processed]);
  }

  function readFile(file) {
    return new Promise((resolve) => {
      const base = { name: file.name, type: file.type, size: file.size };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ ...base, dataUrl: e.target.result, content: null });
        reader.readAsDataURL(file);
      } else if (
        file.type === 'text/plain' ||
        file.type === 'text/csv' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.md')
      ) {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ ...base, content: e.target.result, dataUrl: null });
        reader.readAsText(file);
      } else {
        // PDF or other binary — just note name/type
        resolve({ ...base, content: null, dataUrl: null });
      }
    });
  }

  function removeAttachment(index) {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }

  // ── Voice ────────────────────────────────────────────────────────────────

  function startRecording() {
    if (!speechSupported) return;
    setSpeechError(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    // Support Swahili + English — try 'sw-KE' for Kenyan Swahili
    recognition.lang = 'sw-KE';

    recognition.onstart = () => setRecording(true);

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript)
        .join('');
      setText(transcript);
    };

    recognition.onerror = (event) => {
      // Fall back to en-US if sw-KE not supported
      if (event.error === 'language-not-supported') {
        recognition.lang = 'en-US';
        recognition.start();
        return;
      }
      setSpeechError(event.error === 'not-allowed'
        ? 'Microphone access denied'
        : 'Speech recognition error');
      setRecording(false);
    };

    recognition.onend = () => setRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  const canSend = (text.trim().length > 0 || attachments.length > 0) && !loading;

  return (
    <div className="shrink-0 border-t border-border bg-white/90 backdrop-blur-sm px-4 py-3">
      <div className="max-w-2xl mx-auto">
        {/* Speech error */}
        <AnimatePresence>
          {speechError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-xs text-red-600 mb-2 px-1"
            >
              <AlertCircle size={12} />
              {speechError}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachment previews */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap gap-2 mb-2"
            >
              {attachments.map((a, i) => (
                <AttachmentChip key={i} attachment={a} onRemove={() => removeAttachment(i)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.txt,.csv,.md,.pdf,.json"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Composer row */}
        <div className={cn(
          'flex items-end gap-2 p-2 rounded-2xl border transition-all duration-150',
          'bg-white',
          recording
            ? 'border-red-300 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
            : 'border-border focus-within:border-primary focus-within:shadow-[0_0_0_3px_hsl(171,72%,34%,0.12)]',
        )}>

          {/* Attach button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleFileClick}
            disabled={loading}
            title="Attach file"
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150"
          >
            <Paperclip size={15} />
          </motion.button>

          {/* Textarea */}
          <textarea
            ref={ref}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={recording ? 'Listening…' : 'Ask anything — symptoms, protocols, dawa, rufaa…'}
            disabled={loading || recording}
            rows={1}
            className={cn(
              'flex-1 min-w-0 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60',
              'outline-none border-none focus:ring-0 leading-relaxed py-1 px-1',
              'max-h-40 overflow-y-auto',
            )}
          />

          {/* Voice button */}
          {speechSupported && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={recording ? stopRecording : startRecording}
              disabled={loading}
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150',
                recording
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              {recording ? (
                <Square size={14} className="fill-red-600" />
              ) : (
                <Mic size={16} />
              )}
            </motion.button>
          )}

          {/* Send button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150',
              canSend
                ? 'bg-primary text-white hover:opacity-90 shadow-sm'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={15} className={canSend ? '' : 'opacity-50'} />
            )}
          </motion.button>
        </div>

        {/* Recording pulse indicator */}
        <AnimatePresence>
          {recording && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 mt-2 px-3"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium text-red-600">Recording… tap stop when done</span>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          Enter to send · Shift+Enter for new line · Paperclip to attach files
        </p>
      </div>
    </div>
  );
}

function AttachmentChip({ attachment, onRemove }) {
  const isImage = attachment.type?.startsWith('image/');
  const hasText = !!attachment.content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-xl bg-primary-light border border-primary/20 max-w-[200px]"
    >
      {isImage ? (
        attachment.dataUrl ? (
          <img src={attachment.dataUrl} alt={attachment.name} className="w-5 h-5 rounded object-cover shrink-0" />
        ) : (
          <Image size={13} className="text-primary shrink-0" />
        )
      ) : (
        <FileText size={13} className="text-primary shrink-0" />
      )}
      <span className="text-[11px] font-medium text-primary truncate">{attachment.name}</span>
      {hasText && <span className="text-[10px] text-primary/50 shrink-0">txt</span>}
      <button
        onClick={onRemove}
        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary/20 text-primary/60 hover:text-primary shrink-0 transition-colors"
      >
        <X size={9} />
      </button>
    </motion.div>
  );
}
