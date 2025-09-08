import ChatSdk, {
  Thread,
  ThreadIdOnExternalPlatform,
} from '@nice-devone/nice-cxone-chat-web-sdk';
import { FC, useEffect, useState } from 'react';
import { M1ChatWrapper } from '../M1ChatWidget/M1ChatWrapper';

interface MessengerWindowProps {
  sdk: ChatSdk;
  threadId: ThreadIdOnExternalPlatform;
  onBack?: () => void;
}

export const MessengerWindow: FC<MessengerWindowProps> = ({
  sdk,
  threadId,
  onBack,
}) => {
  const [thread, setThread] = useState<Thread | null>(null);

  useEffect(() => {
    const loadThread = async () => {
      const loadedThread = sdk.getThread(threadId);
      setThread(loadedThread);
    };

    loadThread();
  }, [sdk, threadId]);

  if (!thread) return null;

  return (
    <M1ChatWrapper 
      sdk={sdk} 
      thread={thread}
      onBack={onBack}
      showBackButton={!!onBack}
      title="Ask Mindy"
    />
  );
};
