import {
  ChatSdk,
  ThreadView,
  LoadThreadMetadataChatEvent,
  SecureSessions,
  ChatSDKOptions,
} from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC, useEffect, useRef, useState, useCallback } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { M1ThreadMenu } from '../M1ChatWidget/M1ThreadMenu';
import { M1ChatView } from '../M1ChatWidget/M1ChatView';
import { getThreadIdStorageKey } from '../Chat/utils/getThreadIdStorageKey';
import { STORAGE_CHAT_CUSTOMER_ID } from '../constants';

// Initialize Chat SDK with required options
const chatSdkOptions: ChatSDKOptions = {
  brandId: Number(import.meta.env.REACT_APP_BRAND_ID as string),
  channelId: import.meta.env.REACT_APP_CHANNEL_ID as string,
  customerId: localStorage.getItem(STORAGE_CHAT_CUSTOMER_ID) || crypto?.randomUUID(),
  // use your environment from  EnvironmentName enum
  environment: import.meta.env.REACT_APP_ENVIRONMENT,
  customEnvironment:
    import.meta.env.REACT_APP_ENVIRONMENT === 'custom'
      ? {
          authorize: import.meta.env.REACT_APP_CUSTOM_ENVIRONMENT_AUTHORIZE,
          chat: import.meta.env.REACT_APP_CUSTOM_ENVIRONMENT_CHAT,
          gateway: import.meta.env.REACT_APP_CUSTOM_ENVIRONMENT_GATEWAY,
          name: import.meta.env.REACT_APP_CUSTOM_ENVIRONMENT_NAME,
        }
      : undefined,
  isLivechat: true,
  securedSession: SecureSessions.ANONYMOUS,
  cacheStorage: null,
  storage: null,
  onError: (error) => {
    console.error('Chat SDK error:', error);
  },
  appName: 'Nice Chat SDK Demo',
};

export const MultiThreadMessenger: FC = () => {
  const [threadList, setThreadList] = useState<Array<ThreadView> | null>(null);
  const [selectedThreadId, selectThreadId] = useState<string | null>(null);
  const [selectedThreadName, setSelectedThreadName] = useState<string | null>(null);
  const sdkRef = useRef<ChatSdk>(new ChatSdk(chatSdkOptions));
  const sdk = sdkRef.current;

  const handleLoadThreadList = useCallback(() => {
    const loadThreadList = async () => {
      try {
        sdk.connect();
        const threads = await sdk.getThreadList();
        setThreadList(threads ?? []);
      } catch (error: unknown) {
        console.error(error);
      }
    };
    loadThreadList();
  }, [sdk]);

  const handleThreadSelect = (idOnExternalPlatform: string) => {
    localStorage.setItem(
      getThreadIdStorageKey(sdk.channelId),
      idOnExternalPlatform,
    );
    selectThreadId(idOnExternalPlatform);
    
    // Find and set the thread name
    const thread = threadList?.find(t => t.idOnExternalPlatform === idOnExternalPlatform);
    setSelectedThreadName(thread?.threadName || null);
  };

  const handleThreadArchive = async (idOnExternalPlatform: string) => {
    const thread = sdk.getThread(idOnExternalPlatform);
    try {
      await thread.archive();
      handleLoadThreadList();
    } catch (error: unknown) {
      console.error(error);
    }
  };

  const handleLoadThreadMetadata = async (
    idOnExternalPlatform: string,
  ): Promise<LoadThreadMetadataChatEvent | null> => {
    const thread = sdk.getThread(idOnExternalPlatform);
    try {
      return await thread.getMetadata();
    } catch (error: unknown) {
      console.error(error);
      return null;
    }
  };

  const handleBackClick = () => {
    localStorage.setItem(getThreadIdStorageKey(sdk.channelId), '');
    selectThreadId(null);
    setSelectedThreadName(null);
    handleLoadThreadList();
  };

  const handleThreadNameChange = async (
    idOnExternalPlatform: string,
    name: string,
  ) => {
    const thread = sdk.getThread(idOnExternalPlatform);
    if (thread) {
      const result = await thread.setName(name);

      if (result) {
        // Update the thread name in the threadList state immediately
        setThreadList(prevList => {
          if (!prevList) return prevList;
          return prevList.map(t => 
            t.idOnExternalPlatform === idOnExternalPlatform 
              ? { ...t, threadName: name }
              : t
          );
        });
      } else {
        console.error('Thread name change failed');
      }
    }
  };

  // try to load saved customer id and thread id
  useEffect(() => {
    handleLoadThreadList();
  }, [handleLoadThreadList]);

  if (!threadList) {
    return (
      <div className="loader">
        <CircularProgress />
      </div>
    );
  }

  if (selectedThreadId !== null) {
    const thread = sdk.getThread(selectedThreadId);
    if (!thread) {
      // If thread doesn't exist, go back to menu
      handleBackClick();
      return null;
    }
    
    return (
      <M1ChatView 
        sdk={sdk} 
        thread={thread}
        threadName={selectedThreadName || undefined}
        onBack={handleBackClick}
        onThreadNameChange={(name) => {
          setSelectedThreadName(name);
          // Update the thread name in the threadList state
          setThreadList(prevList => {
            if (!prevList) return prevList;
            return prevList.map(t => 
              t.idOnExternalPlatform === selectedThreadId 
                ? { ...t, threadName: name }
                : t
            );
          });
        }}
      />
    );
  }

  const handleNewThread = () => {
    const newThreadId = crypto.randomUUID();
    handleThreadSelect(newThreadId);
  };

  return (
    <M1ThreadMenu
      threads={threadList}
      onThreadSelect={handleThreadSelect}
      onNewThread={handleNewThread}
      onThreadNameChange={handleThreadNameChange}
      onThreadArchive={handleThreadArchive}
    />
  );
};
