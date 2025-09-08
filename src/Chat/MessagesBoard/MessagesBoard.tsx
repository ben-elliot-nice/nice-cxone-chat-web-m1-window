import { isMessage, Message } from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { MessageItem } from '../MessageItem/MessageItem';
import { LoadMoreMessagesTrigger } from './LoadMoreMessagesTrigger/LoadMoreMessagesTrigger';
import { SystemMessage } from '../SystemMessage/SystemMessage';
import { HotTopics } from '../HotTopics/HotTopics';
import { PopularQuestions } from '../PopularQuestions/PopularQuestions';
import { Card } from '@mui/material';
import './MessagesBoard.css';
import { Postback } from '../MessageRichContent/MessageRichContent.tsx';

type IntroSection = {
  id: string;
  type: 'hotTopics' | 'popularQuestions';
  createdAt: string;
};

interface MessagesBoardProps {
  messages: Map<string, Message | SystemMessage | IntroSection>;
  loadMoreMessages: () => void;
  onPostback: (postback: Postback) => void;
  onQuickReply?: (option: string) => void;
  onTopicClick?: (topic: string) => void;
  onQuestionClick?: (question: string) => void;
}

export const MessagesBoard: FC<MessagesBoardProps> = ({
  messages,
  loadMoreMessages,
  onPostback,
  onQuickReply,
  onTopicClick,
  onQuestionClick,
}) => {
  const [shouldHideQuickReplies, setShouldHideQuickReplies] = useState(false);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [isStableAfterLoad, setIsStableAfterLoad] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isIntroSection = (item: any): item is IntroSection => {
    return item && typeof item === 'object' && 'type' in item && (item.type === 'hotTopics' || item.type === 'popularQuestions');
  };
  
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

  const handleQuickRepliesDetected = useCallback((shouldShow: boolean) => {
    if (shouldShow) {
      // A new message with QRs was detected - reset the global hide flag
      setShouldHideQuickReplies(false);
    }
  }, []);

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
      }
      // Don't set shouldHideQuickReplies to false for bot messages
      // Let Quick Replies only show when explicitly detected in MessageText component
    }
    setPreviousMessageCount(currentCount);
  }, [messageArray, previousMessageCount, isStableAfterLoad, shouldHideQuickReplies]);

  return (
    <div className="messages-board">
      {/* Hidden for now - uncomment to show load more messages button */}
      {/* <LoadMoreMessagesTrigger onTrigger={loadMoreMessages} /> */}
      {messageArray
        .map((item) => {
          if (isMessage(item)) {
            return (
              <MessageItem
                message={item}
                key={item.id}
                onAction={onPostback}
                onQuickReply={handleQuickReply}
                shouldHideQuickReplies={shouldHideQuickReplies}
                onQuickRepliesDetected={handleQuickRepliesDetected}
              />
            );
          } else if (isIntroSection(item)) {
            return (
              <Card 
                key={item.id}
                className="message-item message-item__outbound"
                sx={{
                  padding: '8px 12px !important',
                  borderRadius: '0 18px 18px 18px !important',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1) !important',
                  background: 'white !important',
                  margin: '5px 0 !important',
                  maxWidth: '85%',
                  alignSelf: 'flex-start',
                  overflow: 'visible !important',
                  '& .MuiCardContent-root': {
                    padding: '0 !important',
                    '&:last-child': {
                      paddingBottom: '0 !important'
                    }
                  }
                }}
              >
                {item.type === 'hotTopics' && onTopicClick ? (
                  <HotTopics onTopicClick={onTopicClick} />
                ) : item.type === 'popularQuestions' && onQuestionClick ? (
                  <PopularQuestions onQuestionClick={onQuestionClick} />
                ) : null}
              </Card>
            );
          } else {
            return <SystemMessage message={item} key={item.id} />;
          }
        })
        .filter(Boolean)}
      {/* Invisible element at the bottom for scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
};
