# Prompt: Chat UI Components

## Description
Create reusable React components for a chat interface with message display, composer input, and streaming support.

---

## The Prompt

```
Create React components for a chat interface:
1. ChatMessage - displays user/assistant messages with different styles
2. ChatComposer - input field with send button and voice input option
3. MessageList - scrollable container that auto-scrolls to newest message
4. TypingIndicator - animated dots for loading state
5. Use Tailwind CSS for styling
6. Support markdown rendering in assistant messages
7. Handle streaming responses with progressive display
8. Include copy-to-clipboard for code blocks

Make components accessible with proper ARIA labels.
```

---

## Expected Output

### ChatMessage.jsx
```jsx
'use client';

import { memo } from 'react';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';

function ChatMessage({ message, isUser }) {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div 
      className={`flex gap-3 p-4 ${isUser ? 'bg-gray-50' : 'bg-white'}`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center shrink-0
        ${isUser ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
      `}>
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {isUser ? 'You' : 'AfyaPack'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="prose prose-sm max-w-none text-gray-700">
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <AssistantContent content={message.content} />
          )}
        </div>
        
        {/* Citations */}
        {message.citations?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.citations.map((citation, i) => (
              <span 
                key={i}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
              >
                📄 {citation.title}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Actions */}
      {!isUser && (
        <button
          onClick={handleCopy}
          className="p-1 text-gray-400 hover:text-gray-600 shrink-0"
          aria-label="Copy message"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}

function AssistantContent({ content }) {
  // Simple markdown-like parsing
  const lines = content.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        // Headers
        if (line.startsWith('## ')) {
          return <h3 key={i} className="font-semibold text-gray-900">{line.slice(3)}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={i} className="font-bold text-gray-900">{line.slice(2)}</h2>;
        }
        // List items
        if (line.startsWith('- ') || line.startsWith('• ')) {
          return <li key={i} className="ml-4">{line.slice(2)}</li>;
        }
        // Bold
        if (line.includes('**')) {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i}>
              {parts.map((part, j) => 
                j % 2 === 1 ? <strong key={j}>{part}</strong> : part
              )}
            </p>
          );
        }
        // Regular paragraph
        if (line.trim()) {
          return <p key={i}>{line}</p>;
        }
        return null;
      })}
    </div>
  );
}

export default memo(ChatMessage);
```

### ChatComposer.jsx
```jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2 } from 'lucide-react';

export default function ChatComposer({ onSend, disabled, placeholder }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setInput(transcript);
      };
      
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };
  
  return (
    <form 
      onSubmit={handleSubmit}
      className="border-t bg-white p-4"
    >
      <div className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Voice input button */}
        {recognitionRef.current && (
          <button
            type="button"
            onClick={toggleVoice}
            className={`
              p-2 rounded-lg transition-colors
              ${isListening 
                ? 'bg-red-100 text-red-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}
            `}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        )}
        
        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Type a message...'}
            disabled={disabled}
            rows={1}
            className="
              w-full resize-none rounded-lg border border-gray-300 
              px-4 py-3 pr-12
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              disabled:bg-gray-50 disabled:text-gray-500
            "
            aria-label="Message input"
          />
        </div>
        
        {/* Send button */}
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className="
            p-3 rounded-lg bg-blue-600 text-white
            hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
            transition-colors
          "
          aria-label="Send message"
        >
          {disabled ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {isListening && (
        <p className="text-center text-sm text-red-600 mt-2 animate-pulse">
          🎤 Listening...
        </p>
      )}
    </form>
  );
}
```

### TypingIndicator.jsx
```jsx
'use client';

import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 p-4" role="status" aria-label="Assistant is typing">
      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
        <Bot className="w-5 h-5" />
      </div>
      <div className="flex items-center gap-1 px-4 py-2 bg-gray-100 rounded-2xl">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-gray-400 rounded-full"
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Usage

```jsx
import { useState } from 'react';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatComposer from '@/components/chat/ChatComposer';
import TypingIndicator from '@/components/chat/TypingIndicator';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const handleSend = async (content) => {
    // Add user message
    setMessages(prev => [...prev, { 
      role: 'user', 
      content, 
      timestamp: Date.now() 
    }]);
    
    setLoading(true);
    // API call...
    setLoading(false);
  };
  
  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg, i) => (
          <ChatMessage 
            key={i} 
            message={msg} 
            isUser={msg.role === 'user'} 
          />
        ))}
        {loading && <TypingIndicator />}
      </div>
      <ChatComposer onSend={handleSend} disabled={loading} />
    </div>
  );
}
```

---

## Variations

### With Streaming
```
Create a ChatMessage component that accepts a streaming prop and progressively displays text character by character.
```

### With Reactions
```
Add reaction buttons (👍 👎) to assistant messages with callback support.
```

### With Message Threading
```
Create a threaded chat interface where users can reply to specific messages.
```
