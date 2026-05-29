'use client';

import React, { useState, useEffect } from 'react';
import Onboarding from '@/components/Onboarding';
import Sidebar, { ChatItem } from '@/components/Sidebar';
import ChatArea, { Message } from '@/components/ChatArea';
import { authAPI, conversationsAPI, sendChatMessageStream, Conversation } from '@/utils/api';

export default function Home() {
  const [user, setUser] = useState<{ name: string; handle: string } | null>(null);
  const [recentChats, setRecentChats] = useState<ChatItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(undefined);
  const [activeChatTitle, setActiveChatTitle] = useState('New Chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Load user profile & theme settings from backend and localStorage on mount
  useEffect(() => {
    async function checkAuthAndLoadData() {
      try {
        // Check active session via backend
        const me = await authAPI.me();
        setUser({ name: me.name, handle: `@${me.username}` });
        
        // Load real chats list
        const chats = await conversationsAPI.list();
        const chatItems = chats.map(c => ({ id: c.id, title: c.title }));
        setRecentChats(chatItems);
        
        // Automatically select the most recent chat if available
        if (chatItems.length > 0) {
          const latestChat = chatItems[0];
          setActiveChatId(latestChat.id);
          setActiveChatTitle(latestChat.title);
          const detail = await conversationsAPI.get(latestChat.id);
          setMessages(detail.messages);
        } else {
          setActiveChatId(undefined);
          setActiveChatTitle('New Chat');
          setMessages([]);
        }
      } catch (err) {
        // Not authenticated, clean state
        setUser(null);
        setRecentChats([]);
        setActiveChatId(undefined);
        setActiveChatTitle('New Chat');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    }

    // Theme setting (light/dark)
    const savedTheme = localStorage.getItem('claude_theme');
    const root = window.document.documentElement;
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      root.classList.add('dark');
    } else {
      setIsDarkMode(false);
      root.classList.remove('dark');
    }
    
    // Set responsive sidebar state
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    checkAuthAndLoadData();
  }, []);

  const handleOnboardingComplete = async (name: string, handle: string) => {
    setUser({ name, handle });
    setIsLoading(true);
    try {
      const chats = await conversationsAPI.list();
      const chatItems = chats.map(c => ({ id: c.id, title: c.title }));
      setRecentChats(chatItems);
      
      // Since it's a new or existing profile, default to empty starting screen
      setActiveChatId(undefined);
      setActiveChatTitle('New Chat');
      setMessages([]);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    const root = window.document.documentElement;
    if (newTheme) {
      root.classList.add('dark');
      localStorage.setItem('claude_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('claude_theme', 'light');
    }
  };

  const handleSendMessage = async (text: string, model: string) => {
    if (!text.trim()) return;

    // Append the user's message locally first
    const userMsg: Message = {
      role: 'user',
      content: text,
      created_at: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);

    let targetChatId = activeChatId;

    try {
      // 1. If it's a "New Chat", we must first create a conversation in the backend
      if (!targetChatId) {
        // Generate clean title (truncate first 24 chars)
        const generatedTitle = text.length > 24 ? text.slice(0, 24) + '...' : text;
        const newConversation = await conversationsAPI.create(generatedTitle);
        
        targetChatId = newConversation.id;
        setActiveChatId(newConversation.id);
        setActiveChatTitle(newConversation.title);
        
        // Add to sidebar recent list immediately
        setRecentChats(prev => [{ id: newConversation.id, title: newConversation.title }, ...prev]);
      }

      // Add a blank placeholder assistant message for streaming
      const placeholderAssistantMsg: Message = {
        role: 'assistant',
        content: '',
        modelUsed: model,
        created_at: new Date()
      };
      
      setMessages(prev => [...prev, placeholderAssistantMsg]);

      // 2. Call SSE stream API to stream tokens in real-time
      await sendChatMessageStream(
        targetChatId,
        text,
        model,
        (token) => {
          // Token callback: append text to last message
          setMessages(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            const lastMsg = updated[lastIndex];
            
            if (lastMsg.role === 'assistant') {
              updated[lastIndex] = {
                ...lastMsg,
                content: lastMsg.content + token
              };
            }
            return updated;
          });
        },
        (nodeName) => {
          // Node start (e.g. LLMGenerationNode / PersistenceNode)
          console.log(`Node started: ${nodeName}`);
        },
        async (nodeName) => {
          // Node end: if persistence node finishes, refresh the conversations list so titles/timestamps are accurate
          if (nodeName === 'PersistenceNode') {
            try {
              const chats = await conversationsAPI.list();
              setRecentChats(chats.map(c => ({ id: c.id, title: c.title })));
            } catch (e) {
              console.error("Failed to refresh recent chats", e);
            }
          }
        },
        (errorMsg) => {
          // Streaming Error callback
          setMessages(prev => {
            if (prev.length === 0) return prev;
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            const lastMsg = updated[lastIndex];
            
            if (lastMsg.role === 'assistant') {
              updated[lastIndex] = {
                ...lastMsg,
                content: lastMsg.content + `\n\n*(Error: ${errorMsg})*`
              };
            }
            return updated;
          });
        }
      );
    } catch (err: any) {
      console.error("Failed to execute chat flow", err);
      // Append static error message if API fails entirely
      const errorAssistantMsg: Message = {
        role: 'assistant',
        content: `Sorry, I encountered an error communicating with the backend: ${err.message || 'Unknown Error'}. Make sure the FastAPI server is running on port 8000.`,
        created_at: new Date()
      };
      setMessages(prev => [...prev, errorAssistantMsg]);
    }
  };

  const handleSelectRecentChat = async (id: string) => {
    setIsLoading(true);
    try {
      const detail = await conversationsAPI.get(id);
      setActiveChatId(detail.id);
      setActiveChatTitle(detail.title);
      setMessages(detail.messages);
    } catch (err) {
      console.error("Failed to load conversation details", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecentChat = async (id: string) => {
    try {
      await conversationsAPI.delete(id);
      setRecentChats(prev => prev.filter(c => c.id !== id));
      
      // If we deleted the active chat, reset current view
      if (activeChatId === id) {
        setActiveChatId(undefined);
        setActiveChatTitle('New Chat');
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
    }
  };

  const handleRenameRecentChat = async (id: string, newTitle: string) => {
    try {
      await conversationsAPI.rename(id, newTitle);
      setRecentChats(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      
      if (activeChatId === id) {
        setActiveChatTitle(newTitle);
      }
    } catch (err) {
      console.error("Failed to rename conversation", err);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authAPI.logout();
      setUser(null);
      setRecentChats([]);
      setActiveChatId(undefined);
      setActiveChatTitle('New Chat');
      setMessages([]);
    } catch (err) {
      console.error("Failed to logout securely", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(undefined);
    setActiveChatTitle('New Chat');
    setMessages([]);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-all duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 text-accent animate-rotate-star">
            <svg viewBox="0 0 100 100" className="w-full h-full fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M50 0 L53 35 L85 15 L62 44 L100 50 L65 53 L85 85 L56 62 L50 100 L47 65 L15 85 L38 56 L0 50 L35 47 L15 15 L44 38 Z" />
            </svg>
          </div>
          <span className="text-xs font-semibold text-foreground/60 tracking-wider font-sans uppercase">
            Loading Space...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans transition-all duration-300">
      <Sidebar 
        userName={user.name}
        userHandle={user.handle}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        recentChats={recentChats}
        activeChatId={activeChatId}
        onSelectRecentChat={handleSelectRecentChat}
        onDeleteRecentChat={handleDeleteRecentChat}
        onRenameRecentChat={handleRenameRecentChat}
        onLogout={handleLogout}
      />
      
      <ChatArea 
        messages={messages}
        onSendMessage={handleSendMessage}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeChatTitle={activeChatTitle}
      />
    </div>
  );
}
