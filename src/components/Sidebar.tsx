'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Search, MessageSquare, FolderKanban, 
  Grid2X2, Code, Sliders, Menu, Sun, Moon, Download, ChevronUp, Trash2, Edit2, LogOut, Check, X
} from 'lucide-react';

export interface ChatItem {
  id: string;
  title: string;
}

interface SidebarProps {
  userName: string;
  userHandle: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  recentChats: ChatItem[];
  activeChatId?: string;
  onSelectRecentChat?: (id: string) => void;
  onDeleteRecentChat?: (id: string) => void;
  onRenameRecentChat?: (id: string, title: string) => void;
  onLogout?: () => void;
}

export default function Sidebar({
  userName,
  userHandle,
  isDarkMode,
  onToggleTheme,
  onNewChat,
  isOpen,
  onToggleSidebar,
  recentChats,
  activeChatId,
  onSelectRecentChat,
  onDeleteRecentChat,
  onRenameRecentChat,
  onLogout
}: SidebarProps) {
  const [activeItem, setActiveItem] = useState('Chats');
  
  // Inline rename state
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // Profile dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { name: 'Search', icon: Search },
    { name: 'Chats', icon: MessageSquare },
    { name: 'Projects', icon: FolderKanban },
    { name: 'Artifacts', icon: Grid2X2 },
    { name: 'Code', icon: Code },
    { name: 'Customize', icon: Sliders },
  ];

  // Close profile menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user initials
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const handleStartRename = (chat: ChatItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleSaveRename = (chatId: string) => {
    if (editTitle.trim() && onRenameRecentChat) {
      onRenameRecentChat(chatId, editTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleKeyDownRename = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(chatId);
    } else if (e.key === 'Escape') {
      setEditingChatId(null);
    }
  };

  return (
    <>
      {/* Mobile Top Bar / Menu Trigger (Visible only on mobile when sidebar is closed) */}
      {!isOpen && (
        <button
          onClick={onToggleSidebar}
          className="fixed top-4 left-4 z-40 p-2.5 bg-card border border-border shadow-md rounded-xl text-foreground md:hidden hover:bg-foreground/5 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={onToggleSidebar}
          className="fixed inset-0 bg-background/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Main Sidebar Container */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-screen z-50
        w-[260px] bg-sidebar border-r border-sidebar-border
        flex flex-col justify-between py-5 px-3
        transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-[0px] md:px-0 md:py-0 md:border-r-0 overflow-hidden'}
      `}>
        {/* Top Section */}
        <div className="flex flex-col gap-5 overflow-y-auto flex-1 pr-1">
          {/* Header */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[20px] font-display font-bold tracking-tight text-foreground/90">
              Claude
            </span>
            <button
              onClick={onToggleSidebar}
              className="p-1.5 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 rounded-lg transition-all"
              title="Close sidebar"
            >
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current stroke-2" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </button>
          </div>

          {/* New Chat Button */}
          <button
            onClick={() => {
              onNewChat();
              setActiveItem('Chats');
            }}
            className="flex items-center gap-2.5 w-full py-2.5 px-3 bg-card border border-border hover:bg-foreground/[0.02] text-foreground text-[14px] font-medium rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-foreground/60" />
            <span>New chat</span>
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveItem(item.name)}
                  className={`
                    flex items-center justify-between w-full py-2 px-3 text-[14px] font-medium rounded-xl transition-all cursor-pointer
                    ${activeItem === item.name 
                      ? 'bg-foreground/[0.04] text-foreground' 
                      : 'text-foreground/65 hover:bg-foreground/[0.02] hover:text-foreground'
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4.5 h-4.5 text-foreground/50" />
                    <span>{item.name}</span>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Recents Section */}
          <div className="flex flex-col gap-1.5 mt-2">
            <span className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wider px-3">
              Recents
            </span>
            <div className="flex flex-col gap-0.5">
              {recentChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`
                    group flex items-center justify-between w-full rounded-xl transition-all px-1
                    ${activeChatId === chat.id
                      ? 'bg-foreground/[0.04] text-foreground' 
                      : 'text-foreground/65 hover:bg-foreground/[0.02] hover:text-foreground'
                    }
                  `}
                >
                  {editingChatId === chat.id ? (
                    <div className="flex items-center gap-1 w-full py-1 px-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyDownRename(e, chat.id)}
                        className="bg-background border border-accent/40 rounded px-1.5 py-0.5 text-[13px] font-medium text-foreground outline-none w-full"
                        autoFocus
                        onBlur={() => handleSaveRename(chat.id)}
                      />
                      <button
                        onClick={() => handleSaveRename(chat.id)}
                        className="p-1 hover:text-green-500 rounded transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingChatId(null)}
                        className="p-1 hover:text-red-500 rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setActiveItem('Chats');
                          if (onSelectRecentChat) onSelectRecentChat(chat.id);
                        }}
                        className="text-left flex-1 py-2 px-2 text-[13px] font-medium truncate cursor-pointer"
                        title={chat.title}
                      >
                        {chat.title}
                      </button>
                      
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button
                          onClick={(e) => handleStartRename(chat, e)}
                          className="p-1.5 hover:text-accent hover:bg-foreground/5 rounded-lg transition-all"
                          title="Rename chat"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteRecentChat) onDeleteRecentChat(chat.id);
                          }}
                          className="p-1.5 hover:text-red-500 hover:bg-foreground/5 rounded-lg transition-all"
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-sidebar-border/60 flex flex-col gap-3 mt-auto relative" ref={profileMenuRef}>
          {/* Logout / Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-[105%] left-0 right-0 bg-card border border-border shadow-2xl rounded-2xl p-1.5 z-[60] animate-in fade-in slide-in-from-bottom-2 duration-150">
              <button
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  if (onLogout) onLogout();
                }}
                className="w-full flex items-center gap-2.5 p-2.5 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-left text-xs font-semibold text-foreground/75 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}

          {/* Theme Switcher & Utility */}
          <div className="flex items-center justify-between px-2">
            <button
              onClick={onToggleTheme}
              className="p-2 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 rounded-full transition-all cursor-pointer"
              title={isDarkMode ? "Light Mode" : "Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            
            <button
              className="p-2 text-foreground/50 hover:text-foreground/80 hover:bg-foreground/5 rounded-full transition-all cursor-pointer"
              title="Download App"
            >
              <Download className="w-[18px] h-[18px]" />
            </button>
          </div>

          {/* User Profile Card */}
          <div 
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center justify-between p-2 hover:bg-foreground/[0.03] rounded-xl transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 truncate">
              {/* Profile Avatar */}
              <div className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center font-display font-semibold text-[13px] shrink-0">
                {getInitials(userName)}
              </div>
              
              {/* Profile details */}
              <div className="flex flex-col truncate leading-tight">
                <span className="text-[13px] font-semibold text-foreground/90 truncate">
                  {userName}
                </span>
                <span className="text-[11px] text-foreground/55 font-sans truncate">
                  {userHandle}
                </span>
              </div>
            </div>

            {/* Menu Chevron */}
            <button className="text-foreground/40 hover:text-foreground/70 p-1 cursor-pointer">
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
