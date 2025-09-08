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
  const [messages, setMessages] = useState<Map<string, Message>>(new Map());
  const [customerName, setCustomerName] = useState<string>(
    localStorage.getItem(STORAGE_CHAT_CUSTOMER_NAME) ?? '',
  );
  const windowFocus = useWindowFocus();
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState<boolean | null>(null);
  const [hiddenMessageIds, setHiddenMessageIds] = useState<Set<string>>(new Set());
  const [isNewThread, setIsNewThread] = useState<boolean>(false);
  const [hasAddedIntroSections, setHasAddedIntroSections] = useState<boolean>(false);
  const hasAddedIntroSectionsRef = useRef<boolean>(false);

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
          console.log('Set isNewThread to true (successful recovery path)');
          // Send a hidden "hi" message to trigger the bot
          await thread.sendTextMessage('hi');
          console.log('Initial hi message sent');
          // We'll mark this message as hidden when it arrives
        } else {
          console.log('Existing thread with', recoveredMessages.length, 'messages');
          setMessages((messages) => mergeMessages(messages, recoveredMessages));
        }
        
        setAgentName(parseAgentName(recoverResponse.inboxAssignee));
      } catch (error) {
        console.log('Thread recovery failed (likely new thread):', error.message);
        // This is likely a new thread that doesn't exist yet
        console.log('Treating as new thread, sending initial message to trigger bot');
        setIsNewThread(true);
        console.log('Set isNewThread to true');
        try {
          await thread.sendTextMessage('hi');
          console.log('Initial hi message sent for new thread');
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

  const addIntroSections = useCallback(() => {
    console.log('Adding intro sections for new thread');
    
    const hotTopicsSection: IntroSection = {
      id: `intro-hot-topics-${Date.now()}`,
      type: 'hotTopics',
      createdAt: new Date().toISOString()
    };
    
    const popularQuestionsSection: IntroSection = {
      id: `intro-popular-questions-${Date.now() + 1}`,
      type: 'popularQuestions', 
      createdAt: new Date().toISOString()
    };
    
    setMessages((prevMessages) => {
      const newMessages = new Map(prevMessages);
      newMessages.set(hotTopicsSection.id, hotTopicsSection);
      newMessages.set(popularQuestionsSection.id, popularQuestionsSection);
      return newMessages;
    });
  }, []);

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
  }, []);

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

      // Check if this is the first "hi" message we sent to trigger the bot
      if (messages.size === 0 && 
          message.direction === 'inbound' && 
          message.messageContent.payload.text.toLowerCase() === 'hi') {
        console.log('Hiding initial hi message:', message.id);
        // Add this message ID to hidden list
        setHiddenMessageIds((prev) => new Set(prev).add(message.id));
      }

      setMessages(
        (messages) =>
          new Map<string, Message>(messages.set(message.id, message)),
      );
      
      // Check if this is a bot response to add intro sections
      // Alternative approach: check if this is the first visible bot message
      const isFirstBotMessage = !hasAddedIntroSectionsRef.current && 
                                message.direction === 'outbound' && 
                                !hiddenMessageIds.has(message.id) &&
                                messages.size <= 1; // Only hidden "hi" message exists
      
      console.log('Checking for intro sections:', {
        isNewThread,
        hasAddedIntroSections, 
        hasAddedIntroSectionsRef: hasAddedIntroSectionsRef.current,
        direction: message.direction,
        hidden: hiddenMessageIds.has(message.id),
        messageText: message.messageContent.payload.text,
        messagesSize: messages.size,
        isFirstBotMessage
      });
      
      if (isFirstBotMessage) {
        console.log('First bot response received, adding intro sections');
        // Set the ref immediately to prevent duplicate additions
        hasAddedIntroSectionsRef.current = true;
        setHasAddedIntroSections(true);
        // Add intro sections after a short delay to ensure proper ordering
        setTimeout(() => {
          addIntroSections();
        }, 100);
      }
    },
    [messages.size, isNewThread, hiddenMessageIds, addIntroSections],
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
        />
        {agentTyping ? <AgentTyping /> : null}
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
