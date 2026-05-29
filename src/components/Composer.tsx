'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Mic, ChevronDown, Check, Code, 
  PenTool, GraduationCap, Coffee, Lightbulb, 
  Sparkles, ToggleLeft, ToggleRight, ChevronRight
} from 'lucide-react';

interface ComposerProps {
  onSend: (message: string, model: string) => void;
  placeholder?: string;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  premium?: boolean;
}

export default function Composer({ onSend, placeholder = "Write a message..." }: ComposerProps) {
  const [message, setMessage] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState('Sonnet 4.6');
  const [adaptiveThinking, setAdaptiveThinking] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const models: ModelOption[] = [
    { id: 'opus', name: 'Opus 4.7', description: 'Most capable for ambitiou...' },
    { id: 'sonnet', name: 'Sonnet 4.6', description: 'Responsive everyday work' },
    { id: 'haiku', name: 'Haiku 4.5', description: 'Fastest, most efficient' },
  ];

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!message.trim()) return;
    const modelDisplayName = `${selectedModel}${adaptiveThinking ? ' Adaptive' : ''}`;
    onSend(message, modelDisplayName);
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleChipClick = (chipType: string) => {
    let text = '';
    switch (chipType) {
      case 'code':
        text = 'Write a code snippet to ';
        break;
      case 'write':
        text = 'Help me write an essay about ';
        break;
      case 'learn':
        text = 'Explain the concept of ';
        break;
      case 'life':
        text = 'Give me some tips on ';
        break;
      case 'choice':
        text = 'Suggest an interesting topic for ';
        break;
    }
    setMessage(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const getModelBadgeText = () => {
    return `${selectedModel}${adaptiveThinking ? ' Adaptive' : ''}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-3 py-2 px-4 transition-all duration-300">
      {/* Outer Composer Container */}
      <div className="w-full bg-composer-bg border border-composer-border rounded-[24px] shadow-lg transition-all duration-300 focus-within:ring-1 focus-within:ring-accent/30 focus-within:border-accent">
        
        {/* Input Textarea Area */}
        <div className="w-full px-5 pt-4 pb-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full bg-transparent resize-none border-none outline-none focus:outline-none focus:ring-0 text-[15px] leading-relaxed text-foreground placeholder-foreground/45 min-h-[44px] max-h-[200px]"
          />
        </div>

        {/* Lower Toolbar */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 border-t border-composer-border/40">
          
          {/* Left Actions (Attachment) */}
          <button 
            type="button"
            className="p-2 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 rounded-full transition-all"
            title="Add content"
          >
            <Plus className="w-[20px] h-[20px]" />
          </button>

          {/* Right Actions (Model selector & Voice) */}
          <div className="flex items-center gap-1.5 relative">
            
            {/* Model Selector Badge */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/[0.03] dark:bg-foreground/[0.05] hover:bg-foreground/[0.07] text-[13px] font-medium rounded-xl text-foreground/70 transition-all border border-border/30"
              >
                <span>{getModelBadgeText()}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {/* Model Selector Dropdown Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-[280px] bg-card border border-border shadow-2xl rounded-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="space-y-1">
                    {models.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedModel(m.name);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-foreground/[0.04] rounded-xl text-left transition-all"
                      >
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground/90">{m.name}</span>
                            {m.premium && (
                              <span className="text-[9px] bg-accent/15 text-accent font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Upgrade
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-foreground/50 font-sans">
                            {m.description}
                          </span>
                        </div>
                        {selectedModel === m.name && (
                          <Check className="w-4 h-4 text-accent" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="my-2 border-t border-border/50" />

                  {/* Adaptive Thinking Toggle */}
                  <div className="flex items-center justify-between p-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-foreground/90">Adaptive thinking</span>
                      <span className="text-[11px] text-foreground/50 font-sans">
                        Thinks for more complex tasks
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdaptiveThinking(!adaptiveThinking)}
                      className="text-foreground/70 hover:text-accent transition-colors"
                    >
                      {adaptiveThinking ? (
                        <div className="w-9 h-5 bg-accent rounded-full flex items-center justify-end px-0.5 transition-all">
                          <div className="w-4 h-4 bg-white rounded-full shadow" />
                        </div>
                      ) : (
                        <div className="w-9 h-5 bg-border rounded-full flex items-center justify-start px-0.5 transition-all">
                          <div className="w-4 h-4 bg-white dark:bg-foreground/20 rounded-full shadow" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="my-1 border-t border-border/50" />

                  {/* More Models Option */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between p-2.5 hover:bg-foreground/[0.04] rounded-xl text-left transition-all text-xs font-medium text-foreground/75"
                  >
                    <span>More models</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                </div>
              )}
            </div>

            {/* Voice Input Button */}
            <button
              type="button"
              className="p-2 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 rounded-full transition-all"
              title="Voice input"
            >
              <Mic className="w-[18px] h-[18px]" />
            </button>

            {/* Audio Wave Icon */}
            <button
              type="button"
              className="p-2 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 rounded-full transition-all flex items-center justify-center gap-0.5"
              title="Read aloud"
            >
              <span className="w-0.5 h-2.5 bg-foreground/50 rounded-full animate-pulse" />
              <span className="w-0.5 h-3.5 bg-foreground/50 rounded-full" />
              <span className="w-0.5 h-1.5 bg-foreground/50 rounded-full" />
              <span className="w-0.5 h-3 bg-foreground/50 rounded-full" />
              <span className="w-0.5 h-2 bg-foreground/50 rounded-full" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Chips */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
        <button
          onClick={() => handleChipClick('code')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-foreground/[0.03] border border-border text-[12px] font-medium text-foreground/70 rounded-full transition-all"
        >
          <Code className="w-3.5 h-3.5 text-foreground/50" />
          <span>Code</span>
        </button>

        <button
          onClick={() => handleChipClick('write')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-foreground/[0.03] border border-border text-[12px] font-medium text-foreground/70 rounded-full transition-all"
        >
          <PenTool className="w-3.5 h-3.5 text-foreground/50" />
          <span>Write</span>
        </button>

        <button
          onClick={() => handleChipClick('learn')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-foreground/[0.03] border border-border text-[12px] font-medium text-foreground/70 rounded-full transition-all"
        >
          <GraduationCap className="w-3.5 h-3.5 text-foreground/50" />
          <span>Learn</span>
        </button>

        <button
          onClick={() => handleChipClick('life')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-foreground/[0.03] border border-border text-[12px] font-medium text-foreground/70 rounded-full transition-all"
        >
          <Coffee className="w-3.5 h-3.5 text-foreground/50" />
          <span>Life stuff</span>
        </button>

        <button
          onClick={() => handleChipClick('choice')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card hover:bg-foreground/[0.03] border border-border text-[12px] font-medium text-foreground/70 rounded-full transition-all"
        >
          <Lightbulb className="w-3.5 h-3.5 text-foreground/50" />
          <span>Claude's choice</span>
        </button>
      </div>
    </div>
  );
}
