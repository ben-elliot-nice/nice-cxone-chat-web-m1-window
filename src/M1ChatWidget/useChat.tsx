import { useCallback, useEffect, useState } from 'react';
import {
  ChatEvent,
  ChatSdk,
  Thread,
  LivechatThread,
  Message as ContentMessage,
  isMessageCreatedEvent,
  isAgentTypingStartedEvent,
  isAgentTypingEndedEvent,
} from '@nice-devone/nice-cxone-chat-web-sdk';
import { parseAgentName } from '../Chat/Agent/agentName';
import { mergeMessages } from '../state/messages/mergeMessages';
import { STORAGE_CHAT_CUSTOMER_NAME } from '../constants';
import { SystemMessage } from '../Chat/SystemMessage/SystemMessage';
import { Postback } from '../Chat/MessageRichContent/MessageRichContent';

type Message = ContentMessage | SystemMessage;

export const useChat = (sdk: ChatSdk, thread: Thread | LivechatThread) => {
  const [messages, setMessages] = useState<Map<string, Message>>(new Map());
  const [customerName, setCustomerName] = useState<string>(
    localStorage.getItem(STORAGE_CHAT_CUSTOMER_NAME) ?? ''
  );
  const [agentName, setAgentName] = useState<string | null>(null);
  const [agentTyping, setAgentTyping] = useState<boolean>(false);

  // Recover thread on mount
  useEffect(() => {
    sdk.getCustomer()?.setName(localStorage.getItem(STORAGE_CHAT_CUSTOMER_NAME) ?? '');

    const recover = async () => {
      try {
        const recoverResponse = await thread.recover();
        const recoveredMessages = recoverResponse.messages.reverse() as Message[];
        setMessages((messages) => mergeMessages(messages, recoveredMessages));
        setAgentName(parseAgentName(recoverResponse.inboxAssignee));
      } catch (error) {
        console.error(error);
      }
    };

    recover();
  }, [sdk, thread]);

  // Handle message events
  useEffect(() => {
    const handleMessageAdded = (event: any) => {
      if (isMessageCreatedEvent(event)) {
        const message = event.data.message as Message;
        setMessages((messages) => mergeMessages(messages, [message]));
      }
    };

    const handleAgentTypingStarted = (event: any) => {
      if (isAgentTypingStartedEvent(event)) {
        setAgentTyping(true);
      }
    };

    const handleAgentTypingEnded = (event: any) => {
      if (isAgentTypingEndedEvent(event)) {
        setAgentTyping(false);
      }
    };

    const removeMessageCreatedListener = thread.onThreadEvent(
      ChatEvent.MESSAGE_CREATED,
      handleMessageAdded
    );

    const removeAgentTypingStartedListener = sdk.onChatEvent(
      ChatEvent.AGENT_TYPING_STARTED,
      handleAgentTypingStarted
    );

    const removeAgentTypingEndedListener = sdk.onChatEvent(
      ChatEvent.AGENT_TYPING_ENDED,
      handleAgentTypingEnded
    );

    return () => {
      removeMessageCreatedListener();
      removeAgentTypingStartedListener();
      removeAgentTypingEndedListener();
    };
  }, [sdk, thread]);

  // Handle sending messages
  const handleMessageSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !customerName) return;

      try {
        await thread.sendTextMessage(text);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    },
    [thread, customerName]
  );

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (!customerName) return;

      try {
        for (let i = 0; i < files.length; i++) {
          await thread.sendAttachment(files[i]);
        }
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    },
    [thread, customerName]
  );

  // Handle typing
  const handleTyping = useCallback(() => {
    thread.startTyping();
  }, [thread]);

  // Handle customer name change
  const handleCustomerNameChange = useCallback(
    (name: string) => {
      setCustomerName(name);
      localStorage.setItem(STORAGE_CHAT_CUSTOMER_NAME, name);
      sdk.getCustomer()?.setName(name);
    },
    [sdk]
  );

  // Handle postback
  const handlePostback = useCallback(
    async (postback: Postback) => {
      try {
        await thread.sendPostback(postback.text, postback.value, []);
      } catch (error) {
        console.error('Failed to send postback:', error);
      }
    },
    [thread]
  );

  return {
    messages,
    customerName,
    agentName,
    agentTyping,
    handleMessageSend,
    handleFileUpload,
    handleTyping,
    handleCustomerNameChange,
    handlePostback,
  };
};