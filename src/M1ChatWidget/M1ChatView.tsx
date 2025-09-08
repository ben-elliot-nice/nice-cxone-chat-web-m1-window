import React, { FC, useState, useCallback } from 'react';
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
        <div className="chat-controls">
          <button className="control-btn" title="Menu">
            <svg viewBox="0 0 448 512" fill="#000" width="16" height="16">
              <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"/>
            </svg>
          </button>
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
          />
        </div>
      </div>
    </div>
  );
};