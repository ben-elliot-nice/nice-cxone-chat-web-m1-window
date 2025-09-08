import React, { FC, useState, useCallback, useRef, useEffect } from 'react';
import { ChatSdk, Thread, LivechatThread } from '@nice-devone/nice-cxone-chat-web-sdk';
import { ChatWindow } from '../Chat/ChatWindow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './M1ChatWidget.css';

interface M1ChatViewProps {
  sdk: ChatSdk;
  thread: Thread | LivechatThread;
  threadName?: string;
  onBack: () => void;
  onThreadNameChange?: (name: string) => void;
}

export const M1ChatView: FC<M1ChatViewProps> = ({ 
  sdk, 
  thread,
  threadName,
  onBack,
  onThreadNameChange
}) => {
  const [localThreadName, setLocalThreadName] = useState(threadName);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const addIntroSectionRef = useRef<((type: 'hotTopics' | 'popularQuestions') => void) | null>(null);

  const handleThreadNameChange = useCallback(async (newName: string) => {
    if (newName && newName !== localThreadName) {
      setLocalThreadName(newName);
      try {
        await thread.setName(newName);
        if (onThreadNameChange) {
          onThreadNameChange(newName);
        }
      } catch (error) {
        console.error('Failed to update thread name:', error);
      }
    }
  }, [thread, localThreadName, onThreadNameChange]);

  const handleMenuClick = useCallback(() => {
    setShowMenu(!showMenu);
  }, [showMenu]);

  const handleMenuItemClick = useCallback((type: 'hotTopics' | 'popularQuestions') => {
    setShowMenu(false);
    
    // Add the intro section to messages
    if (addIntroSectionRef.current) {
      addIntroSectionRef.current(type);
    }
  }, []);

  const handleMenuAddIntroSection = useCallback((addFunction: (type: 'hotTopics' | 'popularQuestions') => void) => {
    addIntroSectionRef.current = addFunction;
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className="chat-widget">
      {/* Header with back button */}
      <div className="chat-header">
        <div className="chat-title">
          <button className="back-btn" onClick={onBack} title="Back to conversations">
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </button>
          <span>{localThreadName || 'Ask Mindy'}</span>
        </div>
        <div className="chat-controls" ref={menuRef}>
          <button className="control-btn" title="Menu" onClick={handleMenuClick}>
            <svg viewBox="0 0 448 512" fill="#000" width="16" height="16">
              <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"/>
            </svg>
          </button>
          {showMenu && (
            <div className="dropdown-menu show">
              <button className="menu-item" onClick={() => handleMenuItemClick('hotTopics')}>
                Hot Topics
              </button>
              <button className="menu-item" onClick={() => handleMenuItemClick('popularQuestions')}>
                Popular Questions
              </button>
              <button className="menu-item" onClick={() => setShowMenu(false)}>
                Print Messages
              </button>
              <div className="menu-separator"></div>
              <button className="menu-item" onClick={() => setShowMenu(false)}>
                Clear Conversation
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat content wrapper */}
      <div className="chat-container">
        <div className="chat-window">
          <ChatWindow 
            sdk={sdk} 
            thread={thread} 
            threadName={localThreadName}
            onThreadNameChange={handleThreadNameChange}
            onMenuAddIntroSection={handleMenuAddIntroSection}
          />
        </div>
      </div>
    </div>
  );
};