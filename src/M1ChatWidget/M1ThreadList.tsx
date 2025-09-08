import React, { FC } from 'react';
import { ThreadView } from '@nice-devone/nice-cxone-chat-web-sdk';
import './M1ChatWidget.css';

interface M1ThreadListProps {
  threads: ThreadView[];
  onThreadSelect: (id: string) => void;
  onNewThread: () => void;
}

export const M1ThreadList: FC<M1ThreadListProps> = ({ 
  threads, 
  onThreadSelect,
  onNewThread 
}) => {
  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span>Ask Mindy - Conversations</span>
        </div>
        <div className="chat-controls">
          <button className="control-btn" title="Menu">
            <svg viewBox="0 0 448 512" fill="#fff" width="16" height="16">
              <path d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"/>
            </svg>
          </button>
        </div>
      </div>
      
      {/* Thread List Body */}
      <div className="chat-body">
        <div className="messages-container">
          {/* New Thread Button */}
          <div className="message bot-message" onClick={onNewThread} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="#ff9e1b">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
              <span style={{ fontWeight: 500 }}>Start New Conversation</span>
            </div>
          </div>
          
          {/* Thread List Header */}
          {threads.length > 0 && (
            <div className="message bot-message">
              <h3 className="section-title">Your Conversations</h3>
              <div className="topic-list">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    className="topic-btn"
                    onClick={() => onThreadSelect(thread.idOnExternalPlatform)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '10px 0'
                    }}
                  >
                    <span>{thread.threadName || 'Untitled Conversation'}</span>
                    {!thread.canAddMoreMessages && (
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        fontStyle: 'italic'
                      }}>
                        Closed
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {threads.length === 0 && (
            <div className="message bot-message">
              <p style={{ textAlign: 'center', color: '#666' }}>
                No conversations yet. Start a new one to get help from Mindy!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};