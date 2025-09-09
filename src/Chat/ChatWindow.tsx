import React, { FC, useCallback, useEffect, useRef, useState, useMemo } from 'react';

import {
  AssignedAgentChangedData,
  AssignedAgentChangedEvent,
  ChatEvent,
  ChatEventData,
  ChatSdk,
  ContactToRoutingQueueAssignmentChangedChatEvent,
  isAgentTypingEndedEvent,
  isAgentTypingStartedEvent,
  isMessageCreatedEvent,
  LivechatThread,
  Message as ContentMessage,
  Thread,
} from '@nice-devone/nice-cxone-chat-web-sdk';

import { MessagesBoard } from './MessagesBoard/MessagesBoard';
import { SendMessageForm } from './SendMessageForm/SendMessageForm';
import { Customer } from './Customer/Customer';
import { useWindowFocus } from '../hooks/focus';
import { parseAgentName } from './Agent/agentName';
import { mergeMessages } from '../state/messages/mergeMessages';
import { STORAGE_CHAT_CUSTOMER_NAME } from '../constants';

const STORAGE_HIDDEN_MESSAGES = 'chat-hidden-messages';
const STORAGE_INTRO_SECTIONS_ADDED = 'chat-intro-sections-added';
const STORAGE_INTRO_SECTIONS = 'chat-intro-sections';
import { AgentTyping } from './Agent/AgentTyping';
import { SystemMessage } from './SystemMessage/SystemMessage';
import { Postback } from './MessageRichContent/MessageRichContent.tsx';
import { HotTopics } from './HotTopics/HotTopics';
import { PopularQuestions } from './PopularQuestions/PopularQuestions';

type IntroSection = {
  id: string;
  type: 'hotTopics' | 'popularQuestions';
  createdAt: string;
};

type Message = ContentMessage | SystemMessage | IntroSection;

interface ChatWindowProps {
  sdk: ChatSdk;
  thread: Thread | LivechatThread;
  threadName?: string;
  onThreadNameChange?: (name: string) => void;
  onMenuAddIntroSection?: (addFunction: (type: 'hotTopics' | 'popularQuestions') => void) => void;
}

export const ChatWindow: FC<ChatWindowProps> = ({ sdk, thread, threadName, onThreadNameChange, onMenuAddIntroSection }) => {
  const threadId = thread.id || 'default';
  
  // Load persisted state
  const loadHiddenMessages = (): Set<string> => {
    try {
      const stored = localStorage.getItem(`${STORAGE_HIDDEN_MESSAGES}-${threadId}`);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  };
  
  const loadIntroSectionsAdded = (): boolean => {
    try {
      const stored = localStorage.getItem(`${STORAGE_INTRO_SECTIONS_ADDED}-${threadId}`);
      return stored === 'true';
    } catch {
      return false;
    }
  };

  const [messages, setMessages] = useState<Map<string, Message>>(new Map());
  const [customerName, setCustomerName] = useState<string>(
    localStorage.getItem(STORAGE_CHAT_CUSTOMER_NAME) ?? '',
  );
  const windowFocus = useWindowFocus();
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState<boolean | null>(null);
  const [showCustomTyping, setShowCustomTyping] = useState<boolean>(false);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(loadHiddenMessages());
  const [isNewThread, setIsNewThread] = useState<boolean>(false);
  const [hasAddedIntroSections, setHasAddedIntroSections] = useState<boolean>(loadIntroSectionsAdded());
  const hasAddedIntroSectionsRef = useRef<boolean>(loadIntroSectionsAdded());
  
  // Helper function to check if a message contains QR-triggering text
  const hasQuickReplyText = (message: ContentMessage): boolean => {
    const text = message.messageContent?.payload?.text || '';
    const expectedText = `Please select from one of the following options so I can better help you:
- Daily Passport
- Data Passport
- Worldwide Roaming
- PAYG & RS
- Roaming Troubleshooting`;
    return text.trim() === expectedText.trim();
  };
  
  // Persistence functions
  const saveHiddenMessages = (hiddenIds: Set<string>) => {
    try {
      localStorage.setItem(`${STORAGE_HIDDEN_MESSAGES}-${threadId}`, JSON.stringify(Array.from(hiddenIds)));
    } catch (error) {
      console.warn('Failed to save hidden messages:', error);
    }
  };
  
  const saveIntroSectionsAdded = (added: boolean) => {
    try {
      localStorage.setItem(`${STORAGE_INTRO_SECTIONS_ADDED}-${threadId}`, added.toString());
    } catch (error) {
      console.warn('Failed to save intro sections flag:', error);
    }
  };
  
  const saveIntroSections = (introSections: IntroSection[]) => {
    try {
      localStorage.setItem(`${STORAGE_INTRO_SECTIONS}-${threadId}`, JSON.stringify(introSections));
    } catch (error) {
      console.warn('Failed to save intro sections:', error);
    }
  };
  
  const loadIntroSections = (): IntroSection[] => {
    try {
      const stored = localStorage.getItem(`${STORAGE_INTRO_SECTIONS}-${threadId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Recover thread
  useEffect(() => {
    sdk
      .getCustomer()
      ?.setName(localStorage.getItem(STORAGE_CHAT_CUSTOMER_NAME) ?? '');

    const recover = async () => {
      try {
        const recoverResponse = await thread.recover();
        const recoveredMessages =
          recoverResponse.messages.reverse() as Message[];
        
        // Check if this is a brand new thread (no messages)
        if (recoveredMessages.length === 0) {
          console.log('New thread detected, sending initial message to trigger bot');
          setIsNewThread(true);
          // Reset intro sections flag and clear saved intro sections for truly new thread
          hasAddedIntroSectionsRef.current = false;
          setHasAddedIntroSections(false);
          saveIntroSectionsAdded(false);
          saveIntroSections([]); // Clear any saved intro sections
          console.log('Set isNewThread to true and reset intro sections flag (successful recovery path)', {
            hasAddedIntroSectionsRef: hasAddedIntroSectionsRef.current,
            aboutToSetHasAddedIntroSections: false,
            clearedIntroSections: true
          });
          // Send a hidden "hi" message to trigger the bot
          await thread.sendTextMessage('hi');
          console.log('Initial hi message sent');
          // We'll mark this message as hidden when it arrives
        } else {
          console.log('Existing thread with', recoveredMessages.length, 'messages');
          
          // Load and restore intro sections if they exist
          const savedIntroSections = loadIntroSections();
          
          // Merge recovered messages with intro sections in chronological order
          const allMessages = [...recoveredMessages, ...savedIntroSections];
          allMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          
          setMessages((messages) => {
            const newMessages = new Map(messages);
            allMessages.forEach(message => {
              newMessages.set(message.id, message);
            });
            return newMessages;
          });
        }
        
        setAgentName(parseAgentName(recoverResponse.inboxAssignee));
      } catch (error) {
        console.log('Thread recovery failed (likely new thread):', error.message);
        // This is likely a new thread that doesn't exist yet
        console.log('Treating as new thread, sending initial message to trigger bot');
        setIsNewThread(true);
        // Reset intro sections flag and clear saved intro sections for truly new thread
        hasAddedIntroSectionsRef.current = false;
        setHasAddedIntroSections(false);
        saveIntroSectionsAdded(false);
        saveIntroSections([]); // Clear any saved intro sections
        console.log('Set isNewThread to true and reset intro sections flag', {
          hasAddedIntroSectionsRef: hasAddedIntroSectionsRef.current,
          aboutToSetHasAddedIntroSections: false,
          clearedIntroSections: true
        });
        try {
          await thread.sendTextMessage('hi');
          console.log('Initial hi message sent for new thread');
          // Don't load intro sections here since we just cleared them for new thread
        } catch (sendError) {
          console.error('Failed to send initial message:', sendError);
        }
      }
    };

    recover();
  }, [sdk, thread]);

  // Attach ChatEvent listeners
  useEffect(() => {
    const removeMessageCreatedEventListener = thread.onThreadEvent(
      ChatEvent.MESSAGE_CREATED,
      handleMessageAdded,
    );
    const removeAssignedAgentChangedListener = sdk.onChatEvent(
      ChatEvent.ASSIGNED_AGENT_CHANGED,
      handleAssignedAgentChangeEvent,
    );

    const removeRoutingQueueAssignmentChangedListener = sdk.onChatEvent(
      ChatEvent.CONTACT_TO_ROUTING_QUEUE_ASSIGNMENT_CHANGED,
      handleRoutingQueueAssignmentChangedEvent,
    );

    const removeAgentTypingStartedListener = sdk.onChatEvent(
      ChatEvent.AGENT_TYPING_STARTED,
      handleAgentTypingStartedEvent,
    );

    const removeAgentTypingEndedListener = sdk.onChatEvent(
      ChatEvent.AGENT_TYPING_ENDED,
      handleAgentTypingEndedEvent,
    );

    return () => {
      removeMessageCreatedEventListener();
      removeAssignedAgentChangedListener();
      removeRoutingQueueAssignmentChangedListener();
      removeAgentTypingStartedListener();
      removeAgentTypingEndedListener();
    };
  }, []);

  // Mark all messages as read on focus
  useEffect(() => {
    if (windowFocus && messages.size > 0) {
      thread.lastMessageSeen().catch((error) => console.error(error));
    }
  }, [thread, messages, windowFocus]);

  const addIntroSections = useCallback((botMessageTimestamp?: string) => {
    console.log('Adding intro sections for new thread');
    
    // Create timestamps that place intro sections immediately after the bot message
    const baseTime = botMessageTimestamp ? new Date(botMessageTimestamp).getTime() : Date.now();
    const timestamp1 = baseTime + 1; // 1ms after bot message
    const timestamp2 = baseTime + 2; // 2ms after bot message
    
    const hotTopicsSection: IntroSection = {
      id: `intro-hot-topics-${baseTime}`,
      type: 'hotTopics',
      createdAt: new Date(timestamp1).toISOString()
    };
    
    const popularQuestionsSection: IntroSection = {
      id: `intro-popular-questions-${baseTime}`,
      type: 'popularQuestions', 
      createdAt: new Date(timestamp2).toISOString()
    };
    
    const introSections = [hotTopicsSection, popularQuestionsSection];
    
    setMessages((prevMessages) => {
      const newMessages = new Map(prevMessages);
      introSections.forEach(section => {
        newMessages.set(section.id, section);
      });
      return newMessages;
    });
    
    // Save intro sections to localStorage
    saveIntroSections(introSections);
  }, [threadId]);

  const addSingleIntroSection = useCallback((type: 'hotTopics' | 'popularQuestions') => {
    console.log('Adding single intro section from menu:', type);
    
    const introSection: IntroSection = {
      id: `menu-${type}-${Date.now()}`,
      type: type,
      createdAt: new Date().toISOString()
    };
    
    setMessages((prevMessages) => {
      const newMessages = new Map(prevMessages);
      newMessages.set(introSection.id, introSection);
      return newMessages;
    });
    
    // Update saved intro sections by adding this new one
    const existingSections = loadIntroSections();
    saveIntroSections([...existingSections, introSection]);
  }, [threadId]);

  // Expose the addSingleIntroSection function to parent
  useEffect(() => {
    if (onMenuAddIntroSection) {
      onMenuAddIntroSection(addSingleIntroSection);
    }
  }, [onMenuAddIntroSection, addSingleIntroSection]);

  const handleMessageAdded = useCallback(
    (event: CustomEvent<ChatEventData>) => {
      console.log('Message created event:', event);
      if (!isMessageCreatedEvent(event.detail)) {
        return;
      }
      const message = event.detail.data.message;

      // Handle typing indicator logic
      if (message.direction === 'outbound') {
        // Hide custom typing indicator when bot responds
        setShowCustomTyping(false);
      } else if (message.direction === 'inbound') {
        // Show typing indicator for user messages (except initial "hi")
        const isInitialHi = messages.size === 0 && message.messageContent.payload.text.toLowerCase() === 'hi';
        if (!isInitialHi) {
          setShowCustomTyping(true);
        }
      }

      // Check if this is the first "hi" message we sent to trigger the bot
      if (messages.size === 0 && 
          message.direction === 'inbound' && 
          message.messageContent.payload.text.toLowerCase() === 'hi') {
        console.log('Hiding initial hi message:', message.id);
        // Add this message ID to hidden list
        setHiddenMessageIds((prev) => {
          const newHidden = new Set(prev).add(message.id);
          saveHiddenMessages(newHidden);
          return newHidden;
        });
        // DO NOT add intro sections here - wait for bot response
      }

      setMessages(
        (messages) =>
          new Map<string, Message>(messages.set(message.id, message)),
      );
      
      console.log('Message check:', {
        direction: message.direction,
        messageText: message.messageContent.payload.text.substring(0, 50),
        timestamp: message.createdAt,
        hasAddedIntroSectionsRef: hasAddedIntroSectionsRef.current,
        hidden: hiddenMessageIds.has(message.id),
        isHiMessage: message.messageContent.payload.text.toLowerCase() === 'hi'
      });
      
      // Simpler approach: only check if this is the first outbound message that's not hidden
      // and we haven't added intro sections yet
      if (!hasAddedIntroSectionsRef.current && 
          message.direction === 'outbound' && 
          !hiddenMessageIds.has(message.id)) {
        console.log('First bot response received, adding intro sections');
        // Set the ref immediately to prevent duplicate additions
        console.log('Setting intro flags to true for bot message');
        hasAddedIntroSectionsRef.current = true;
        setHasAddedIntroSections(true);
        saveIntroSectionsAdded(true);
        // Add intro sections after a short delay to ensure proper ordering
        setTimeout(() => {
          addIntroSections(message.createdAt);
        }, 100);
      }
    },
    [isNewThread, hiddenMessageIds, addIntroSections],
  );

  const handleAssignedAgentChangeEvent = useCallback(
    (event: CustomEvent<ChatEventData>) => {
      setAgentName(
        parseAgentName(
          (event.detail.data as AssignedAgentChangedData).inboxAssignee,
        ),
      );
      const systemMessage = event.detail as AssignedAgentChangedEvent;
      setMessages(
        (messages) =>
          new Map<string, Message>(
            messages.set(systemMessage.id, systemMessage),
          ),
      );
    },
    [],
  );

  const handleRoutingQueueAssignmentChangedEvent = useCallback(
    (event: CustomEvent<ChatEventData>) => {
      const systemMessage =
        event.detail as ContactToRoutingQueueAssignmentChangedChatEvent;
      setMessages(
        (messages) =>
          new Map<string, Message>(
            messages.set(systemMessage.id, systemMessage),
          ),
      );
    },
    [],
  );

  const handleAgentTypingStartedEvent = useCallback(
    (event: CustomEvent<ChatEventData>) => {
      if (isAgentTypingStartedEvent(event.detail)) {
        setAgentTyping(true);
      }
    },
    [],
  );

  const handleAgentTypingEndedEvent = useCallback(
    (event: CustomEvent<ChatEventData>) => {
      if (isAgentTypingEndedEvent(event.detail)) {
        setAgentTyping(false);
      }
    },
    [],
  );

  const handleInputCustomerNameChanged = useCallback(
    (newCustomerName: string) => {
      localStorage.setItem(STORAGE_CHAT_CUSTOMER_NAME, newCustomerName);
      setCustomerName(newCustomerName);
      sdk.getCustomer()?.setName(newCustomerName);
    },
    [],
  );

  const handleSendMessage = useCallback(
    (messageText: string) => {
      // Don't show typing indicator immediately - wait for message to appear
      thread.sendTextMessage(messageText);
    },
    [thread],
  );

  const handleFileUpload = useCallback(
    (fileList: FileList) => {
      thread.sendAttachments(fileList);
    },
    [thread],
  );

  const messagePreviewTimeoutId = useRef<ReturnType<typeof setTimeout>>();

  const handleMessageKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      thread.keystroke();

      const inputFieldContent = event.currentTarget.value;
      // defer sending message preview to avoid sending too many requests
      if (messagePreviewTimeoutId.current) {
        clearTimeout(messagePreviewTimeoutId.current);
      }
      messagePreviewTimeoutId.current = setTimeout(() => {
        thread.sendMessagePreview(inputFieldContent);
      }, 300);
    },
    [thread],
  );

  const handleLoadMoreMessages = useCallback(async () => {
    const loadMoreMessageResponse = await thread.loadMoreMessages();

    if (loadMoreMessageResponse === null) {
      return;
    }

    const loadedMessages =
      loadMoreMessageResponse.data.messages.reverse() || [];

    setMessages((messages) => mergeMessages(messages, loadedMessages));
  }, [thread]);

  const handlePostback = useCallback(
    async (postback: Postback) => {
      const { text, postback: postbackValue } = postback;
      await thread.sendPostbackMessage(postbackValue, text);
    },
    [thread],
  );

  const handleQuickReply = useCallback(
    (option: string) => {
      thread.sendTextMessage(option);
    },
    [thread],
  );

  const handleTopicClick = useCallback(
    (topic: string) => {
      thread.sendTextMessage(topic);
    },
    [thread],
  );

  const handleQuestionClick = useCallback(
    (question: string) => {
      thread.sendTextMessage(question);
    },
    [thread],
  );

  // Filter out hidden messages before passing to MessagesBoard
  const visibleMessages = useMemo(() => {
    const filtered = new Map<string, Message>();
    messages.forEach((message, id) => {
      if (!hiddenMessageIds.has(id)) {
        filtered.set(id, message);
      }
    });
    return filtered;
  }, [messages, hiddenMessageIds]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Customer 
        name={customerName} 
        onChange={handleInputCustomerNameChanged}
        threadName={threadName}
        onThreadNameChange={onThreadNameChange}
      />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MessagesBoard
          messages={visibleMessages}
          loadMoreMessages={handleLoadMoreMessages}
          onPostback={handlePostback}
          onQuickReply={handleQuickReply}
          onTopicClick={handleTopicClick}
          onQuestionClick={handleQuestionClick}
          showTypingIndicator={showCustomTyping || agentTyping}
        />
      </div>
      <SendMessageForm
        onSubmit={handleSendMessage}
        onFileUpload={handleFileUpload}
        onKeyUp={handleMessageKeyUp}
        disabled={false}
      />
    </div>
  );
};
