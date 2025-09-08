import { isMessage, Message } from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC, useMemo, useState, useCallback } from 'react';
import { MessageItem } from '../MessageItem/MessageItem';
import { LoadMoreMessagesTrigger } from './LoadMoreMessagesTrigger/LoadMoreMessagesTrigger';
import { SystemMessage } from '../SystemMessage/SystemMessage';
import './MessagesBoard.css';
import { Postback } from '../MessageRichContent/MessageRichContent.tsx';

interface MessagesBoardProps {
  messages: Map<string, Message | SystemMessage>;
  loadMoreMessages: () => void;
  onPostback: (postback: Postback) => void;
  onQuickReply?: (option: string) => void;
}

export const MessagesBoard: FC<MessagesBoardProps> = ({
  messages,
  loadMoreMessages,
  onPostback,
  onQuickReply,
}) => {
  const [shouldHideQuickReplies, setShouldHideQuickReplies] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [isStableAfterLoad, setIsStableAfterLoad] = useState(false);
  
  const messageArray = useMemo(
    () => Array.from(messages.values()),
    [messages.size],
  );

  const handleQuickReply = useCallback((option: string) => {
    setShouldHideQuickReplies(true);
    if (onQuickReply) {
      onQuickReply(option);
    }
  }, [onQuickReply]);

  // Wait for messages to stabilize after initial load before tracking changes
  useMemo(() => {
    const currentCount = messageArray.length;
    
    // Wait for messages to stop changing (stabilize) before we start tracking
    if (!isStableAfterLoad) {
      const timeoutId = setTimeout(() => {
        setIsStableAfterLoad(true);
        setPreviousMessageCount(currentCount);
      }, 500); // Wait 500ms for messages to stabilize
      
      return () => clearTimeout(timeoutId);
    }
    
    // Only track changes after messages have stabilized
    if (currentCount > previousMessageCount) {
      // New message was added - check if it's from user
      const latestMessage = messageArray[currentCount - 1];
      if (isMessage(latestMessage) && latestMessage.direction === 'inbound') {
        setShouldHideQuickReplies(true);
      } else {
        setShouldHideQuickReplies(false);
      }
    }
    setPreviousMessageCount(currentCount);
  }, [messageArray, previousMessageCount, isStableAfterLoad, shouldHideQuickReplies]);

  return (
    <div className="messages-board">
      {/* Hidden for now - uncomment to show load more messages button */}
      {/* <LoadMoreMessagesTrigger onTrigger={loadMoreMessages} /> */}
      {messageArray
        .map((message) =>
          isMessage(message) ? (
            <MessageItem
              message={message}
              key={message.id}
              onAction={onPostback}
              onQuickReply={handleQuickReply}
              shouldHideQuickReplies={shouldHideQuickReplies}
            />
          ) : (
            <SystemMessage message={message} key={message.id} />
          ),
        )
        .filter(Boolean)}
    </div>
  );
};
