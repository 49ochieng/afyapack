'use client';
import { motion } from 'framer-motion';
import { Sparkles, Activity } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'Child with fever', prompt: 'A 3-year-old child has had fever for 2 days with diarrhea. What should I do?' },
  { label: 'Mtoto ana homa na kuhara', prompt: 'Mtoto wa miaka 2 ana homa ya siku 2 na kuhara. Nianze nini? Ana upungufu wa maji?' },
  { label: 'Maternal warning signs', prompt: 'What are the danger signs I should watch for in a pregnant woman near delivery?' },
  { label: 'Dalili za hatari — mimba', prompt: 'Mjamzito ana maumivu ya tumbo na damu kidogo. Hii ni hatari? Nimpeleke hospitali sasa?' },
  { label: 'ORS preparation', prompt: 'How do I prepare oral rehydration salts for a dehydrated child at home?' },
  { label: 'Angalia hisa za dawa', prompt: 'Dawa zipi zimekwisha au zinakwisha katika hisa yetu ya zahanati?' },
];

const CAPABILITIES = [
  { icon: '🏥', text: 'Protocol-based clinical guidance' },
  { icon: '🌍', text: 'English, Swahili & more' },
  { icon: '📴', text: 'Works fully offline' },
  { icon: '🔒', text: 'All data stays on your device' },
];

export function WelcomeState({ onPrompt }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 py-4"
    >
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-primary items-center justify-center mx-auto shadow-chat-user">
          <Activity size={26} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">AfyaPack AI</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
            Ask questions about clinical protocols, patient symptoms, medicines, or referrals.
            Available offline. Answers grounded in local protocols.
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <div className="grid grid-cols-2 gap-2">
        {CAPABILITIES.map(c => (
          <div key={c.text} className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-border">
            <span className="text-base">{c.icon}</span>
            <span className="text-xs font-medium text-foreground">{c.text}</span>
          </div>
        ))}
      </div>

      {/* Quick prompts */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Try asking</p>
        <div className="space-y-2">
          {QUICK_PROMPTS.map((p, i) => (
            <motion.button
              key={p.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => onPrompt(p.prompt)}
              className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border hover:border-primary/40 hover:bg-primary-light transition-all duration-150 group"
            >
              <Sparkles size={13} className="text-primary/50 shrink-0 group-hover:text-primary transition-colors" />
              <span className="text-sm text-foreground group-hover:text-primary transition-colors">{p.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-center text-[11px] text-muted-foreground">
        Protocol-based decision support only · Not a diagnosis · Always apply clinical judgement
      </p>
    </motion.div>
  );
}
