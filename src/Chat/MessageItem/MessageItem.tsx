import './MessageItem.css';
import { getAuthor, Message } from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC, useState, useCallback } from 'react';
import { MessageAttachments } from './MessageAttachments.tsx';
import { MessageText } from './MessageText.tsx';
import { QuickReplyOptions } from './QuickReplyOptions';
import {
  MessageRichContent,
  Postback,
} from '../MessageRichContent/MessageRichContent.tsx';

interface MessageItemProps {
  message: Message;
  onAction: (postback: Postback) => void;
  shouldHideQuickReplies?: boolean;
  onQuickReply?: (option: string) => void;
  onQuickRepliesDetected?: (shouldShow: boolean, messageId?: string) => void;
}

const OPTIONS = [
  "Daily Passport",
  "Data Passport", 
  "Worldwide Roaming",
  "PAYG & RS",
  "Roaming Troubleshooting"
];

export const MessageItem: FC<MessageItemProps> = ({ message, onAction, shouldHideQuickReplies, onQuickReply, onQuickRepliesDetected }) => {
  const isCustomer = message.direction === 'inbound';
  const author = getAuthor(message);
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  const handleQuickRepliesDetected = useCallback((shouldShow: boolean) => {
    setShowQuickReplies(shouldShow);
    // Also notify the parent MessagesBoard so it can reset global hide state
    if (onQuickRepliesDetected) {
      onQuickRepliesDetected(shouldShow, message.id);
    }
  }, [onQuickRepliesDetected, message.id]);

  const handleQuickReply = useCallback((option: string) => {
    setShowQuickReplies(false);
    if (onQuickReply) {
      onQuickReply(option);
    }
  }, [onQuickReply]);

  return (
    <div className={`message-container ${isCustomer ? 'user-message-container' : 'bot-message-container'}`}>
      <div
        className={`message ${isCustomer ? 'user-message' : 'bot-message'}`}
        data-testid="message-item"
        data-id={message.id}
      >
        <div className="message-content">
          <MessageAttachments attachments={message.attachments} />
          <MessageText 
            text={message.messageContent.payload.text} 
            messageId={message.id}
            onQuickReply={onQuickReply}
            shouldHideQuickReplies={shouldHideQuickReplies}
            onQuickRepliesDetected={handleQuickRepliesDetected}
          />
          <MessageRichContent message={message} onAction={onAction} />
        </div>
      </div>
      
      {/* Show timestamp only when quick replies are NOT showing */}
      {!(showQuickReplies && !shouldHideQuickReplies && !isCustomer) && (
        <div className="message-timestamp">{timestamp}</div>
      )}
      
      {/* Quick replies outside the message container, only for bot messages */}
      {!isCustomer && showQuickReplies && !shouldHideQuickReplies && (
        <div style={{ 
          marginLeft: '0',
          maxWidth: '100%',
          width: '100%',
        }}>
          <QuickReplyOptions 
            options={OPTIONS} 
            onOptionClick={handleQuickReply}
          />
        </div>
      )}
    </div>
  );
};
