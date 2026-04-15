# Lesson 06: Chat Experience

> Build the real-time chat interface with streaming feel.

---

## Lesson Overview

| | |
|---|---|
| **Duration** | 45 minutes |
| **Objective** | Create a polished chat UI with message history |
| **Output** | Working chat page with Copilot-assisted component creation |
| **Prerequisites** | Lesson 05 (Foundry integration complete) |
| **Files/Folders** | `web/src/app/chat/`, `web/src/components/chat/` |

---

## What We're Building

```
┌─────────────────────────────────────────┐
│  AfyaPack - Clinical Chat               │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Hello! I'm here to help...   │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 👤 3yo male with fever and      │   │
│  │    vomiting for 2 days          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 🤖 Based on the malaria         │   │
│  │    protocol [Section 2]...      │   │
│  │    ▌ (typing indicator)         │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│  [Type your question...    ] [Send]     │
└─────────────────────────────────────────┘
```

---

## Step 1: Create the Chat Route on Backend

Create file `api/src/routes/chat.js`:

### Copilot Prompt

```
@workspace Create an Express router for /api/chat with POST endpoint that:
- Accepts { message, history } in body where history is array of {role, content}
- Searches protocols based on message keywords
- Builds a conversational prompt with context
- Returns { message, citations, model }
- Include intent detection for: stock queries, screening, clinical, general
```

### Expected Code

```javascript
const express = require('express');
const { generateText } = require('../services/foundry');
const { buildSystemPrompt, buildChatPrompt } = require('../services/prompts');
const { searchProtocols } = require('../services/retrieval');

const router = express.Router();

// Detect user intent from message
function detectIntent(message) {
  const lower = message.toLowerCase();
  
  if (/stock|medicine|supply|amoxicillin|ors|paracetamol|inventory/i.test(lower)) {
    return 'stock';
  }
  if (/screen|triage|assess|checklist|danger sign/i.test(lower)) {
    return 'screening';
  }
  if (/fever|malaria|diarrhea|pneumonia|cough|vomit|pregnant|child|baby/i.test(lower)) {
    return 'clinical';
  }
  return 'general';
}

router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { message, history = [] } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }
    
    const intent = detectIntent(message);
    console.log(`[Chat] Intent: ${intent} | "${message.slice(0, 50)}..."`);
    
    // Search for relevant protocols for clinical queries
    let protocolChunks = [];
    if (intent === 'clinical' || intent === 'screening') {
      protocolChunks = searchProtocols(message, 3);
    }
    
    // Build context
    let contextSection = '';
    if (protocolChunks.length > 0) {
      contextSection = '\n\n## Relevant Protocol Context:\n';
      protocolChunks.forEach((chunk, i) => {
        contextSection += `\n[${chunk.doc_title} - ${chunk.section}]\n${chunk.content.slice(0, 500)}...\n`;
      });
    }
    
    // Build prompts  
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildChatPrompt(message, history) + contextSection;
    
    // Generate response
    const result = await generateText(userPrompt, systemPrompt);
    
    // Extract citations
    const citations = protocolChunks.map(c => ({
      docId: c.doc_id,
      title: c.doc_title,
      section: c.section,
    }));
    
    const duration = Date.now() - startTime;
    console.log(`[Chat] Responded in ${duration}ms`);
    
    res.json({
      message: result.text,
      citations,
      model: result.model,
      source: result.source,
      intent,
      durationMs: duration,
    });
  } catch (err) {
    console.error('[Chat] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

Wire it up in `api/src/index.js`:
```javascript
const chatRouter = require('./routes/chat');
app.use('/api/chat', chatRouter);
```

---

## Step 2: Create Chat Message Component

Create file `web/src/components/chat/ChatMessage.jsx`:

### Copilot Prompt

```
@workspace Create a React component ChatMessage that:
- Accepts props: role ('user' | 'assistant'), content, citations, isLoading
- Shows user messages aligned right with blue background
- Shows assistant messages aligned left with gray background
- Renders markdown content
- Shows typing indicator animation when isLoading
- Shows citation badges if citations exist
- Use Tailwind CSS for styling
```

### Expected Code

```jsx
'use client';

import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { Badge } from '../ui/badge';

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center py-2">
      <motion.div
        className="w-2 h-2 rounded-full bg-gray-400"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-gray-400"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-gray-400"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

export default function ChatMessage({ role, content, citations = [], isLoading = false }) {
  const isUser = role === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center shrink-0
        ${isUser ? 'bg-blue-500' : 'bg-gray-200'}
      `}>
        {isUser 
          ? <User className="w-4 h-4 text-white" />
          : <Bot className="w-4 h-4 text-gray-600" />
        }
      </div>
      
      {/* Message bubble */}
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-3
        ${isUser 
          ? 'bg-blue-500 text-white rounded-br-sm' 
          : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }
      `}>
        {isLoading ? (
          <TypingIndicator />
        ) : (
          <>
            {/* Message content */}
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {content}
            </div>
            
            {/* Citations */}
            {citations.length > 0 && !isUser && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-200">
                {citations.map((cite, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {cite.title}
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
```

---

## Step 3: Create Chat Composer Component

Create file `web/src/components/chat/ChatComposer.jsx`:

### Copilot Prompt

```
@workspace Create a React component ChatComposer that:
- Has a textarea with auto-resize
- Send button with loading state  
- Calls onSend(message) when submitted
- Clears input after send
- Handles Enter key (Shift+Enter for newline)
- Show disabled state when loading
```

### Expected Code

```jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

export default function ChatComposer({ onSend, isLoading = false, placeholder }) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef(null);
  
  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }, [message]);
  
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!message.trim() || isLoading) return;
    
    onSend(message.trim());
    setMessage('');
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-end">
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Ask about symptoms, protocols, or treatment..."}
        disabled={isLoading}
        className="resize-none min-h-[44px] max-h-[150px]"
        rows={1}
      />
      <Button 
        type="submit" 
        size="icon"
        disabled={!message.trim() || isLoading}
        className="shrink-0"
      >
        {isLoading 
          ? <Loader2 className="w-4 h-4 animate-spin" /> 
          : <Send className="w-4 h-4" />
        }
      </Button>
    </form>
  );
}
```

---

## Step 4: Create Welcome State Component

Create file `web/src/components/chat/WelcomeState.jsx`:

### Copilot Prompt

```
@workspace Create a chat welcome component showing:
- Greeting with AfyaPack branding
- List of suggested questions/prompts
- Quick action buttons for common queries
- Clean centered design
```

### Expected Code

```jsx
'use client';

import { Stethoscope, HelpCircle, Package, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';

const suggestions = [
  {
    icon: HelpCircle,
    title: 'Clinical Question',
    prompt: "3 year old with fever and vomiting for 2 days, what should I check?",
  },
  {
    icon: AlertTriangle,
    title: 'Danger Signs',
    prompt: "What are the danger signs for a child with diarrhea?",
  },
  {
    icon: Package,
    title: 'Stock Check',
    prompt: "Do we have ORS and Zinc tablets in stock?",
  },
];

export default function WelcomeState({ onSuggestionClick }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4">
      {/* Logo */}
      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
        <Stethoscope className="w-8 h-8 text-blue-600" />
      </div>
      
      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Welcome to AfyaPack
      </h2>
      <p className="text-gray-500 mb-8 max-w-md">
        Your AI-powered clinical decision support assistant. Ask me about 
        patient symptoms, treatment protocols, or stock management.
      </p>
      
      {/* Suggestions */}
      <div className="grid gap-3 w-full max-w-md">
        {suggestions.map((item, i) => (
          <Button
            key={i}
            variant="outline"
            className="h-auto py-3 px-4 justify-start text-left"
            onClick={() => onSuggestionClick(item.prompt)}
          >
            <item.icon className="w-5 h-5 mr-3 text-blue-500 shrink-0" />
            <div>
              <div className="font-medium">{item.title}</div>
              <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {item.prompt}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}
```

---

## Step 5: Create the Chat Page

Create file `web/src/app/chat/page.js`:

### Copilot Prompt

```
@workspace Create a Next.js page for /chat that:
- Uses useState for messages array [{role, content, citations}]
- Uses useState for loading state
- Renders message list with ChatMessage components
- Shows WelcomeState when no messages
- Has ChatComposer at bottom
- Auto-scrolls to newest message
- Calls POST /api/chat with message and history
```

### Expected Code

```jsx
'use client';

import { useState, useRef, useEffect } from 'react';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatComposer from '@/components/chat/ChatComposer';
import WelcomeState from '@/components/chat/WelcomeState';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async (content) => {
    // Add user message
    const userMessage = { role: 'user', content, citations: [] };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Build history for context
      const history = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));
      
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, history }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add assistant message
      const assistantMessage = {
        role: 'assistant',
        content: data.message,
        citations: data.citations || [],
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      // Add error message
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        citations: [],
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <WelcomeState onSuggestionClick={sendMessage} />
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((msg, i) => (
              <ChatMessage
                key={i}
                role={msg.role}
                content={msg.content}
                citations={msg.citations}
              />
            ))}
            {isLoading && (
              <ChatMessage role="assistant" isLoading />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Composer */}
      <div className="border-t bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <ChatComposer onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
```

---

## Step 6: Add API Base URL to Environment

Create or update `web/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

## Step 7: Test the Chat

### Start Both Servers

Terminal 1:
```powershell
cd api
npm run dev
```

Terminal 2:
```powershell
cd web
npm run dev
```

### Test in Browser

1. Go to `http://localhost:3000/chat`
2. You should see the welcome state
3. Click a suggestion or type a question
4. Watch the typing indicator
5. See the response with citations

---

## Validation Checklist

- [ ] Welcome state shows on first load
- [ ] Clicking a suggestion sends the message
- [ ] User messages appear on the right (blue)
- [ ] Assistant messages appear on the left (gray)
- [ ] Typing indicator shows during loading
- [ ] Citations (if any) appear in badges
- [ ] Auto-scroll works for new messages
- [ ] Enter key sends, Shift+Enter adds newline

---

## Troubleshooting

### "Failed to get response"
Check that the API is running on port 3001 and CORS is enabled.

### Messages not appearing
Check browser console for errors. Verify API returns expected JSON shape.

### Styling broken
Make sure Tailwind is configured and the UI components exist.

---

## What You Learned

- How to build chat UI with React
- How to manage message history state
- How to implement auto-scroll
- How to show loading/typing states
- How to structure chat components

---

## Next Step

**Proceed to Lesson 07:** Retrieval & Grounding

You'll implement TF-IDF search to ground AI responses in protocols.

---

*Chat is flowing. Time to ground it in real protocols. →*
