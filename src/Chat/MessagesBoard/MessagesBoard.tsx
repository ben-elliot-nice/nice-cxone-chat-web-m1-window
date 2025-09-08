import { isMessage, Message } from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC, useMemo, useState, useCallback, useEffect, useRef } from 'react';
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messageArray = useMemo(
    () => Array.from(messages.values()),
    [messages.size],
  );

  const scrollToBottom = useCallback(() => {
    // Get the messages board container
    const messagesBoard = messagesEndRef.current?.parentElement;
    if (messagesBoard) {
      // Custom smooth scroll with controlled speed
      const targetScroll = messagesBoard.scrollHeight;
      const startScroll = messagesBoard.scrollTop;
      const distance = targetScroll - startScroll;
      const duration = 600; // 600ms for the animation
      let startTime: number | null = null;

      const animateScroll = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth acceleration/deceleration
        const easeInOutQuad = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        messagesBoard.scrollTop = startScroll + (distance * easeInOutQuad);
        
        if (progress < 1) {
          requestAnimationFrame(animateScroll);
        }
      };
      
      requestAnimationFrame(animateScroll);
    }
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageArray.length > 0) {
      scrollToBottom();
    }
  }, [messageArray.length, scrollToBottom]);

  const handleQuickReply = useCallback((option: string) => {
    // Don't set shouldHideQuickReplies here - let the actual message arrival handle it
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
      {/* Invisible element at the bottom for scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
};
