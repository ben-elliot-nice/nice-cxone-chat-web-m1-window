import './MessageItem.css';
import { getAuthor, Message } from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC } from 'react';
import { MessageAttachments } from './MessageAttachments.tsx';
import { MessageText } from './MessageText.tsx';
import {
  MessageRichContent,
  Postback,
} from '../MessageRichContent/MessageRichContent.tsx';

interface MessageItemProps {
  message: Message;
  onAction: (postback: Postback) => void;
}

export const MessageItem: FC<MessageItemProps> = ({ message, onAction }) => {
  const isCustomer = message.direction === 'inbound';
  const author = getAuthor(message);
  const timestamp = new Date(message.createdAt).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`message-container ${isCustomer ? 'user-message-container' : 'bot-message-container'}`}>
      <div
        className={`message ${isCustomer ? 'user-message' : 'bot-message'}`}
        data-testid="message-item"
        data-id={message.id}
      >
        {!isCustomer && (
          <div className="message-header">
            <span className="message-author">{author}</span>
          </div>
        )}
        <div className="message-content">
          <MessageAttachments attachments={message.attachments} />
          <MessageText text={message.messageContent.payload.text} />
          <MessageRichContent message={message} onAction={onAction} />
        </div>
      </div>
      <div className="message-timestamp">{timestamp}</div>
    </div>
  );
};
