'use client';

import React, { useState } from 'react';
import { 
  ChevronDown, Copy, ThumbsUp, ThumbsDown, 
  RotateCw, Check
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import Composer from './Composer';

import 'katex/dist/katex.min.css';

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string | Date;
  modelUsed?: string;
}

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (text: string, model: string) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeChatTitle: string;
}

// Custom code block renderer with Copy button and styling
const CodeBlock = ({ className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (match) {
    return (
      <div className="my-4 rounded-xl overflow-hidden border border-border/50 bg-[#1e1e1e] dark:bg-[#121211] font-sans">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] dark:bg-[#1c1c1a] border-b border-border/20 text-xs font-sans text-[#a9a9a9]">
          <span>{lang.toUpperCase()}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-white text-[#a9a9a9] transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-green-500 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        {/* Code Content */}
        <pre className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-[#d4d4d4] select-text">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code className="px-1.5 py-0.5 bg-foreground/5 dark:bg-foreground/10 rounded text-sm font-mono text-accent" {...props}>
      {children}
    </code>
  );
};

export default function ChatArea({
  messages,
  onSendMessage,
  isSidebarOpen,
  onToggleSidebar,
  activeChatTitle
}: ChatAreaProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background relative overflow-hidden transition-all duration-300">
      
      {/* Top Header Bar */}
      <header className="w-full h-14 border-b border-border/30 flex items-center justify-between px-6 shrink-0 bg-background/80 backdrop-blur-md z-30">
        
        {/* Left Side: Sidebar Toggle & Chat Name */}
        <div className="flex items-center gap-3">
          {/* Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 rounded-lg transition-all cursor-pointer"
            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isSidebarOpen ? (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="3" x2="3" y2="21" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            )}
          </button>

          {/* Active Chat Title Dropdown */}
          <button className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-foreground/5 text-[14px] font-semibold text-foreground/85 rounded-xl transition-all cursor-pointer">
            <span>{activeChatTitle}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 flex flex-col justify-between">
        
        {/* Chat Thread */}
        <div className="w-full max-w-3xl mx-auto flex-1 flex flex-col justify-start">
          {messages.length === 0 ? (
            /* Brand New Empty State */
            <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-12 px-4 select-none">
              
              {/* Spinning Orange Starburst */}
              <div className="w-[72px] h-[72px] mb-8 text-accent animate-rotate-star">
                <svg viewBox="0 0 100 100" className="w-full h-full fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 0 L53 35 L85 15 L62 44 L100 50 L65 53 L85 85 L56 62 L50 100 L47 65 L15 85 L38 56 L0 50 L35 47 L15 15 L44 38 Z" />
                </svg>
              </div>

              {/* Title Greeting */}
              <h2 className="text-3xl font-display font-medium tracking-tight text-foreground/90 max-w-md leading-tight">
                How can I help you today?
              </h2>
            </div>
          ) : (
            /* Chat Messages List */
            <div className="space-y-8 pb-32">
              {messages.map((msg, index) => (
                <div 
                  key={index}
                  className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-3 duration-200`}
                >
                  {/* Sender initials / Label */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5.5 h-5.5 text-accent">
                        <svg viewBox="0 0 100 100" className="w-full h-full fill-current" xmlns="http://www.w3.org/2000/svg">
                          <path d="M50 0 L53 35 L85 15 L62 44 L100 50 L65 53 L85 85 L56 62 L50 100 L47 65 L15 85 L38 56 L0 50 L35 47 L15 15 L44 38 Z" />
                        </svg>
                      </div>
                      <span className="text-[12px] font-bold text-foreground/50 uppercase tracking-wide font-sans">
                        Claude
                      </span>
                      {msg.modelUsed && (
                        <span className="text-[10px] bg-foreground/[0.04] text-foreground/50 px-1.5 py-0.5 rounded-md font-medium border border-border/20">
                          {msg.modelUsed}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div className={`
                    max-w-[85%] text-[15px] leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-bubble-user text-foreground px-4.5 py-2.5 rounded-[20px] rounded-tr-[4px] font-medium shadow-xs border border-border/20' 
                      : 'text-foreground font-serif w-full'
                    }
                  `}>
                    {/* Render message with ReactMarkdown parsing for math, tables, lists, code */}
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap select-text">{msg.content}</div>
                    ) : (
                      <div className="markdown-body font-serif select-text leading-relaxed">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                          components={{
                            code: CodeBlock,
                            p({ children }) {
                              return <p className="mb-4 leading-relaxed font-serif text-[16px] text-foreground/95 last:mb-0">{children}</p>;
                            },
                            h1({ children }) {
                              return <h1 className="text-2xl font-display font-bold mt-6 mb-3 text-foreground">{children}</h1>;
                            },
                            h2({ children }) {
                              return <h2 className="text-xl font-display font-semibold mt-5 mb-2 text-foreground">{children}</h2>;
                            },
                            h3({ children }) {
                              return <h3 className="text-lg font-display font-semibold mt-4 mb-2 text-foreground">{children}</h3>;
                            },
                            ul({ children }) {
                              return <ul className="list-disc pl-6 mb-4 space-y-1.5 font-serif text-[15px]">{children}</ul>;
                            },
                            ol({ children }) {
                              return <ol className="list-decimal pl-6 mb-4 space-y-1.5 font-serif text-[15px]">{children}</ol>;
                            },
                            li({ children }) {
                              return <li className="text-foreground/90">{children}</li>;
                            },
                            blockquote({ children }) {
                              return (
                                <blockquote className="border-l-4 border-accent/40 pl-4 py-1 my-4 italic text-foreground/75 font-serif bg-foreground/[0.01] rounded-r-lg">
                                  {children}
                                </blockquote>
                              );
                            },
                            a({ href, children }) {
                              return (
                                <a 
                                  className="text-accent hover:text-accent-hover underline decoration-dotted transition-colors" 
                                  href={href} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                >
                                  {children}
                                </a>
                              );
                            },
                            table({ children }) {
                              return (
                                <div className="overflow-x-auto my-6 border border-border/40 rounded-xl bg-card">
                                  <table className="min-w-full divide-y divide-border/30 font-sans text-sm">
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            thead({ children }) {
                              return <thead className="bg-foreground/[0.02] text-foreground/75 font-semibold">{children}</thead>;
                            },
                            tbody({ children }) {
                              return <tbody className="divide-y divide-border/20">{children}</tbody>;
                            },
                            tr({ children }) {
                              return <tr className="hover:bg-foreground/[0.01] transition-colors">{children}</tr>;
                            },
                            th({ children }) {
                              return <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider">{children}</th>;
                            },
                            td({ children }) {
                              return <td className="px-4 py-3 text-foreground/80">{children}</td>;
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {/* Claude action row */}
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mt-3 text-foreground/45">
                      <button
                        onClick={() => handleCopyText(msg.content, index)}
                        className="p-1.5 hover:text-foreground/80 hover:bg-foreground/5 rounded-lg transition-all cursor-pointer"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        className="p-1.5 hover:text-foreground/80 hover:bg-foreground/5 rounded-lg transition-all cursor-pointer"
                        title="Good response"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      
                      <button
                        className="p-1.5 hover:text-foreground/80 hover:bg-foreground/5 rounded-lg transition-all cursor-pointer"
                        title="Bad response"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                      
                      <button
                        className="p-1.5 hover:text-foreground/80 hover:bg-foreground/5 rounded-lg transition-all cursor-pointer"
                        title="Retry response"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      {copiedIndex === index && (
                        <span className="text-xs font-sans text-accent font-semibold px-2">Copied!</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Empty placeholder spacer when thread is short */}
        {messages.length > 0 && <div className="h-20 shrink-0" />}
      </div>

      {/* Floating Composer Area at bottom */}
      <div className="absolute bottom-0 left-0 right-0 py-6 bg-gradient-to-t from-background via-background to-background/0 px-6 shrink-0 z-20">
        <Composer 
          onSend={onSendMessage} 
          placeholder={messages.length === 0 ? "Write a message..." : "Reply to Claude..."}
        />
        
        {/* Footer Warning */}
        <p className="text-center text-[11px] text-foreground/40 mt-3 font-sans">
          Claude is AI and can make mistakes. Please double-check responses.
        </p>
      </div>

    </div>
  );
}
