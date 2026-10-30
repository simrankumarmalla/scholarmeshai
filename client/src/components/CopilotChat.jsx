import React, { useState, useEffect, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import { Send, Bot, User, Sparkles, Quote, BookOpen, ArrowRight, Loader2, HelpCircle } from 'lucide-react';

const CopilotChat = ({ workspace, initialMessages = [] }) => {
  const [messages, setMessages] = useState(initialMessages);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || loading) return;

    setError('');
    setInputQuestion('');

    // Optimistically add user message
    const tempUserMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      message_text: q,
      citations: [],
      follow_up_questions: [],
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      setLoading(true);
      const res = await axiosClient.post(`/workspaces/${workspace.id}/copilot`, { question: q });

      if (res.data.success) {
        setMessages(prev => [...prev, res.data.message]);
      }
    } catch (err) {
      console.error('Copilot query error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to query Copilot.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[720px] overflow-hidden">
      {/* Copilot Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-100">Grounded Research Copilot</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Gemini 2.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-md">
              Context grounded in "{workspace.research_question}"
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
          {messages.length} messages
        </span>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-slate-200">Interrogate Your Workspace Corpus</h4>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Ask specific questions about methodologies, sample statistics, opposing findings, or dosage thresholds. Every answer is strictly grounded with source citations.
              </p>
            </div>

            <div className="w-full max-w-lg space-y-2 pt-2">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left">
                Suggested Research Queries:
              </p>
              {[
                `Where do these studies disagree on dosing thresholds and what sample sizes were used?`,
                `What experimental controls were utilized to evaluate hepatotoxicity or adverse events?`,
                `Summarize the statistical significance (p-values / effect sizes) reported across all papers.`
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="w-full text-left text-xs p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 text-slate-300 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{suggestion}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const citations = Array.isArray(msg.citations)
              ? msg.citations
              : typeof msg.citations === 'string'
              ? JSON.parse(msg.citations || '[]')
              : [];

            const followUps = Array.isArray(msg.follow_up_questions)
              ? msg.follow_up_questions
              : typeof msg.follow_up_questions === 'string'
              ? JSON.parse(msg.follow_up_questions || '[]')
              : [];

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-indigo-400" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-lg'
                  }`}
                >
                  {/* Message Text */}
                  <div className="leading-relaxed whitespace-pre-wrap">{msg.message_text}</div>

                  {/* Clickable Grounded Citations (for Assistant) */}
                  {!isUser && citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Grounded Source Citations ({citations.length})
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {citations.map((cite, cIdx) => (
                          <div
                            key={cIdx}
                            className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs space-y-1 hover:border-slate-700 transition-colors"
                          >
                            <p className="font-semibold text-slate-200 text-[11px] flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              {cite.source_title}
                            </p>
                            {cite.relevance_note && (
                              <p className="text-[11px] text-slate-400">{cite.relevance_note}</p>
                            )}
                            {cite.key_excerpt && (
                              <p className="text-[10px] text-slate-400 italic bg-slate-950/80 p-1.5 rounded border border-slate-800/60">
                                "{cite.key_excerpt}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Follow-up Question Chips */}
                  {!isUser && followUps.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-slate-500" />
                        Suggested Inquiries:
                      </span>
                      <div className="flex flex-col gap-1.5">
                        {followUps.map((fu, fuIdx) => (
                          <button
                            key={fuIdx}
                            type="button"
                            onClick={() => handleSend(fu)}
                            className="text-left text-[11px] px-2.5 py-1.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-colors flex items-center justify-between group"
                          >
                            <span>{fu}</span>
                            <ArrowRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-1" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-md shadow-indigo-600/20">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-none p-3.5 flex items-center gap-3 text-xs text-slate-400 animate-pulse">
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>Grounding answer against workspace claims & citations with Gemini 2.5 Flash...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything grounded in this workspace's uploaded research papers..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !inputQuestion.trim()}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] shrink-0"
            title="Send query to Copilot"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Strict citation grounding enforced • Powered by @google/genai (gemini-2.5-flash)
        </p>
      </div>
    </div>
  );
};

export default CopilotChat;
