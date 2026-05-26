import React, { FC, useState, useCallback } from 'react';
import { ThreadView } from '@nice-devone/nice-cxone-chat-web-sdk';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ChatIcon from '@mui/icons-material/Chat';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import './M1ChatWidget.css';
import './M1ThreadMenu.css';

interface M1ThreadMenuProps {
  threads: ThreadView[];
  onThreadSelect: (id: string) => void;
  onNewThread: () => void;
  onThreadNameChange?: (id: string, name: string) => void;
  onThreadArchive?: (id: string) => void;
}

export const M1ThreadMenu: FC<M1ThreadMenuProps> = ({ 
  threads, 
  onThreadSelect,
  onNewThread,
  onThreadNameChange,
  onThreadArchive
}) => {
  const [editingThreadId, setEditingThreadId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleEditClick = useCallback((e: React.MouseEvent, thread: ThreadView) => {
    e.stopPropagation();
    setEditingThreadId(thread.id);
    setEditingName(thread.threadName || 'Untitled Conversation');
  }, []);

  const handleSaveEdit = useCallback((e: React.MouseEvent, threadId: string, externalId: string) => {
    e.stopPropagation();
    if (onThreadNameChange && editingName.trim()) {
      onThreadNameChange(externalId, editingName.trim());
    }
    setEditingThreadId(null);
    setEditingName('');
  }, [editingName, onThreadNameChange]);

  const handleCancelEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingThreadId(null);
    setEditingName('');
  }, []);

  const handleArchive = useCallback((e: React.MouseEvent, externalId: string) => {
    e.stopPropagation();
    if (onThreadArchive) {
      onThreadArchive(externalId);
    }
  }, [onThreadArchive]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent, threadId: string, externalId: string) => {
    if (e.key === 'Enter') {
      handleSaveEdit(e as any, threadId, externalId);
    } else if (e.key === 'Escape') {
      handleCancelEdit(e as any);
    }
  }, [handleSaveEdit, handleCancelEdit]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="chat-widget">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-title">
          <ChatIcon sx={{ fontSize: 20 }} />
          <span>Conversations</span>
        </div>
      </div>
      
      {/* Menu Body */}
      <div className="thread-menu-body">
        {/* New Conversation Button */}
        <button className="new-thread-btn" onClick={onNewThread}>
          <AddIcon />
          <span>Start New Conversation</span>
        </button>

        {/* Thread List */}
        {threads.length > 0 ? (
          <div className="thread-list">
            <div className="thread-list-header">
              <span className="thread-count">{threads.length} Conversation{threads.length !== 1 ? 's' : ''}</span>
            </div>
            
            {threads.map((thread) => (
              <div
                key={thread.id}
                className={`thread-item ${!thread.canAddMoreMessages ? 'thread-closed' : ''}`}
                onClick={() => onThreadSelect(thread.idOnExternalPlatform)}
              >
                {editingThreadId === thread.id ? (
                  <div className="thread-edit-container" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      className="thread-name-input"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, thread.id, thread.idOnExternalPlatform)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="thread-edit-actions">
                      <button 
                        className="thread-action-btn save"
                        onClick={(e) => handleSaveEdit(e, thread.id, thread.idOnExternalPlatform)}
                        title="Save"
                      >
                        <CheckIcon fontSize="small" />
                      </button>
                      <button 
                        className="thread-action-btn cancel"
                        onClick={handleCancelEdit}
                        title="Cancel"
                      >
                        <CloseIcon fontSize="small" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="thread-content">
                      <div className="thread-name">
                        {thread.threadName || 'Untitled Conversation'}
                      </div>
                      <div className="thread-meta">
                        {thread.messagesCount > 0 && (
                          <span className="thread-message-count">
                            {thread.messagesCount} message{thread.messagesCount !== 1 ? 's' : ''}
                          </span>
                        )}
                        {thread.lastMessageDate && (
                          <span className="thread-date">
                            {formatDate(thread.lastMessageDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="thread-actions">
                      {thread.canAddMoreMessages && (
                        <button 
                          className="thread-action-btn"
                          onClick={(e) => handleEditClick(e, thread)}
                          title="Edit name"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                      )}
                      {!thread.canAddMoreMessages && onThreadArchive && (
                        <button 
                          className="thread-action-btn archive"
                          onClick={(e) => handleArchive(e, thread.idOnExternalPlatform)}
                          title="Archive conversation"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <ChatIcon sx={{ fontSize: 48, color: '#ccc', mb: 2 }} />
            <h3>No conversations yet</h3>
            <p>Start a new conversation to get help</p>
          </div>
        )}
      </div>
    </div>
  );
};