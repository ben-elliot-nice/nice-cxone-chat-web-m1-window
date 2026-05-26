import React, { FC, useState } from 'react';
import './M1Modern.css';
import { ChatSdk, Thread, LivechatThread } from '@nice-devone/nice-cxone-chat-web-sdk';
import { ChatWindow } from '../Chat/ChatWindow';

interface M1ChatWrapperProps {
  sdk: ChatSdk;
  thread: Thread | LivechatThread;
  onBack?: () => void;
  showBackButton?: boolean;
  title?: string;
}

export const M1ChatWrapper: FC<M1ChatWrapperProps> = ({ 
  sdk, 
  thread, 
  onBack,
  showBackButton = false,
  title = "Ask Mindy"
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className={`chat-widget ${isMinimized ? 'minimized' : ''} ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          {showBackButton && (
            <button className="back-btn" onClick={onBack}>
              <svg viewBox="0 0 448 512" width="16" height="16" fill="#fff">
                <path d="M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"/>
              </svg>
            </button>
          )}
          <span>{title}</span>
        </div>
        <div className="chat-controls">
          <button className="control-btn" title="Menu">
            <svg viewBox="0 0 448 512" fill="#fff" width="16" height="16">
              <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"/>
            </svg>
          </button>
          <button 
            className="control-btn" 
            title="Fullscreen"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <svg viewBox="0 0 448 512" fill="#fff" width="16" height="16">
              <path d="M0 180V56c0-13.3 10.7-24 24-24h124c6.6 0 12 5.4 12 12v40c0 6.6-5.4 12-12 12H64v84c0 6.6-5.4 12-12 12H12c-6.6 0-12-5.4-12-12zM288 44v40c0 6.6 5.4 12 12 12h84v84c0 6.6 5.4 12 12 12h40c6.6 0 12-5.4 12-12V56c0-13.3-10.7-24-24-24H300c-6.6 0-12 5.4-12 12zm148 276h-40c-6.6 0-12 5.4-12 12v84h-84c-6.6 0-12 5.4-12 12v40c0 6.6 5.4 12 12 12h124c13.3 0 24-10.7 24-24V332c0-6.6-5.4-12-12-12zM160 468v-40c0-6.6-5.4-12-12-12H64v-84c0-6.6-5.4-12-12-12H12c-6.6 0-12 5.4-12 12v124c0 13.3 10.7 24 24 24h124c6.6 0 12-5.4 12-12z"/>
            </svg>
          </button>
          <button 
            className="control-btn" 
            title="Minimize"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            <svg viewBox="0 0 448 512" fill="#fff" width="16" height="16">
              <path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"/>
            </svg>
          </button>
          <button 
            className="control-btn" 
            title="Close"
            onClick={() => setIsVisible(false)}
          >
            <svg viewBox="0 0 352 512" fill="#fff" width="16" height="16">
              <path d="M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Use the original ChatWindow wrapped in our styled containers */}
      {!isMinimized && (
        <>
          <div className="chat-body">
            <div className="chat-container">
              <div className="chat-window">
                <ChatWindow sdk={sdk} thread={thread} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};