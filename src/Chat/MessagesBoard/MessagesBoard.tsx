import { isMessage, Message } from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC, useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { MessageItem } from '../MessageItem/MessageItem';
import { LoadMoreMessagesTrigger } from './LoadMoreMessagesTrigger/LoadMoreMessagesTrigger';
import { SystemMessage } from '../SystemMessage/SystemMessage';
import { HotTopics } from '../HotTopics/HotTopics';
import { PopularQuestions } from '../PopularQuestions/PopularQuestions';
import { AgentTyping } from '../Agent/AgentTyping';
import { Card } from '@mui/material';
import './MessagesBoard.css';
import { Postback } from '../MessageRichContent/MessageRichContent.tsx';

const STORAGE_PROCESSED_QR_MESSAGES = 'chat-processed-qr-messages';

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
  showTypingIndicator?: boolean;
}

export const MessagesBoard: FC<MessagesBoardProps> = ({
  messages,
  loadMoreMessages,
  onPostback,
  onQuickReply,
  onTopicClick,
  onQuestionClick,
  showTypingIndicator,
}) => {
  const [shouldHideQuickReplies, setShouldHideQuickReplies] = useState(true);
  const [previousMessageCount, setPreviousMessageCount] = useState(0);
  const [isStableAfterLoad, setIsStableAfterLoad] = useState(false);
  const [latestQRMessageId, setLatestQRMessageId] = useState<string | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load processed messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PROCESSED_QR_MESSAGES);
      if (stored) {
        processedMessagesRef.current = new Set(JSON.parse(stored));
        console.log('Loaded processed QR messages:', Array.from(processedMessagesRef.current));
      }
    } catch (e) {
      console.warn('Failed to load processed QR messages:', e);
    }
  }, []);

  // Check if most recent message should show QRs on initial load
  useEffect(() => {
    const messageArray = Array.from(messages.values());
    if (messageArray.length > 0) {
      // Find the most recent actual message (not intro section)
      const actualMessages = messageArray.filter(msg => isMessage(msg)).sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      
      if (actualMessages.length > 0) {
        const mostRecentMessage = actualMessages[actualMessages.length - 1];
        
        // If the most recent message is outbound and is the exact QR message, allow it to show QRs
        const text = mostRecentMessage.messageContent?.payload?.text || '';
        const expectedText = `Please select from one of the following options so I can better help you:
- Daily Passport
- Data Passport
- Worldwide Roaming
- PAYG & RS
- Roaming Troubleshooting`;
        
        if (mostRecentMessage.direction === 'outbound' && text.trim() === expectedText.trim()) {
          
          console.log('Most recent message on thread load has QRs:', mostRecentMessage.id);
          setLatestQRMessageId(mostRecentMessage.id);
          setShouldHideQuickReplies(false);
        }
      }
    }
  }, [messages.size]); // Run when messages are first loaded

  const saveProcessedMessages = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_PROCESSED_QR_MESSAGES, JSON.stringify(Array.from(processedMessagesRef.current)));
    } catch (e) {
      console.warn('Failed to save processed QR messages:', e);
    }
  }, []);
  
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

  const handleQuickRepliesDetected = useCallback((shouldShow: boolean, messageId?: string) => {
    if (shouldShow && messageId) {
      // Only process if this message hasn't been processed before (truly new)
      if (!processedMessagesRef.current.has(messageId)) {
        console.log('New QR message detected:', messageId);
        processedMessagesRef.current.add(messageId);
        setLatestQRMessageId(messageId);
        setShouldHideQuickReplies(false);
        saveProcessedMessages();
      } else {
        console.log('Ignoring already processed QR message:', messageId);
      }
    }
  }, [saveProcessedMessages]);

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
                shouldHideQuickReplies={shouldHideQuickReplies || (latestQRMessageId !== null && latestQRMessageId !== item.id)}
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
      {/* Typing indicator */}
      {showTypingIndicator && <AgentTyping />}
      {/* Invisible element at the bottom for scrolling */}
      <div ref={messagesEndRef} />
    </div>
  );
};
