import React, { useState } from 'react';
import { Bot, Send, ArrowRight, X, ShieldAlert, Cpu } from 'lucide-react';
import { queryInvestigatorCopilot } from '../services/api';
import type { CopilotResponse } from '../types/graph';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onHighlightNodes?: (nodeIds: string[]) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  recommendation?: string;
  highlightedNodes?: string[];
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Who is the mastermind?',
  'Show money trail and hawala flow',
  'Who is the supplier for explosives and weapons?',
  'Check tower rendezvous and physical meetings',
  'Predict hidden links between suspects',
  'What are the legal BNS 2023 sections applicable?'
];

export const InvestigatorCopilot: React.FC<Props> = ({ isOpen, onClose, onHighlightNodes }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'copilot',
      text: '**Investigator Copilot AI (v3.0 Apex) Online.**\nI can assist with real-time multi-source graph reasoning, syndicate hierarchy resolution, hawala money trail audits, and BNS 2023 legal section attribution.',
      recommendation: 'Select a priority prompt below or ask any question regarding active surveillance intelligence.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (qText?: string) => {
    const query = (qText || inputQuery).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!qText) setInputQuery('');
    setLoading(true);

    try {
      const resp: CopilotResponse = await queryInvestigatorCopilot(query);
      const botMsg: ChatMessage = {
        id: `c-${Date.now()}`,
        sender: 'copilot',
        text: resp.answer,
        recommendation: resp.actionable_recommendation,
        highlightedNodes: resp.highlighted_node_ids,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMsg]);

      if (resp.highlighted_node_ids && resp.highlighted_node_ids.length > 0 && onHighlightNodes) {
        onHighlightNodes(resp.highlighted_node_ids);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'copilot',
          text: `⚠️ Query processing error: ${err.message || 'Failed to contact copilot engine'}`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-slate-900/95 border-l border-cyan-500/30 shadow-2xl backdrop-blur-md flex flex-col font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20 text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-100">Investigator Copilot</h2>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded">
                v3.0 APEX
              </span>
            </div>
            <p className="text-xs text-slate-400">Natural Language Crime Graph Intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Prompts Bar */}
      <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 overflow-x-auto flex gap-2 no-scrollbar">
        {QUICK_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-slate-800 hover:bg-cyan-950/60 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-xl p-3 text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-md shadow-cyan-900/20'
                  : 'bg-slate-800/90 border border-slate-700/80 text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">
                {m.text.split('\n').map((line, lIdx) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={lIdx} className="font-semibold text-cyan-300 my-1">{line.replace(/\*\*/g, '')}</p>;
                  }
                  return <p key={lIdx} className="my-0.5">{line}</p>;
                })}
              </div>

              {m.recommendation && (
                <div className="mt-3 p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>RECOMMENDED INVESTIGATIVE ACTION</span>
                  </div>
                  <p className="text-[11px] text-amber-100/90">{m.recommendation}</p>
                </div>
              )}

              {m.highlightedNodes && m.highlightedNodes.length > 0 && onHighlightNodes && (
                <button
                  onClick={() => onHighlightNodes(m.highlightedNodes!)}
                  className="mt-2.5 inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline underline-offset-2"
                >
                  Highlight {m.highlightedNodes.length} related entities on canvas <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 p-3 bg-slate-800/60 rounded-xl max-w-[80%] animate-pulse">
            <Cpu className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Traversing Knowledge Graph & calculating centrality...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask Copilot about suspects, money trail, BNS sections..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="p-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white rounded-lg transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
