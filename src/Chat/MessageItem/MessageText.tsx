import { Typography } from '@mui/material';
import { FC, useState, useEffect } from 'react';
import { QuickReplyOptions } from './QuickReplyOptions';

interface MessageTextProps {
  text: string;
  messageId?: string;
  onQuickReply?: (option: string) => void;
  shouldHideQuickReplies?: boolean;
  onQuickRepliesDetected?: (shouldShow: boolean) => void;
}

const SPECIFIC_MESSAGE = `Please select from one of the following options so I can better help you:
- Daily Passport
- Data Passport
- Worldwide Roaming
- PAYG & RS
- Roaming Troubleshooting`;

export const MessageText: FC<MessageTextProps> = ({ 
  text, 
  messageId,
  onQuickReply,
  shouldHideQuickReplies = false,
  onQuickRepliesDetected
}) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    // Check if this is the exact specific message we want to handle
    if (text && text.trim() === SPECIFIC_MESSAGE.trim()) {
      // For exact match, display only the first line (before the options)
      setDisplayText("Please select from one of the following options so I can better help you:");
      if (onQuickRepliesDetected) {
        onQuickRepliesDetected(true);
      }
    } else {
      setDisplayText(text);
      if (onQuickRepliesDetected) {
        onQuickRepliesDetected(false);
      }
    }
  }, [text, onQuickRepliesDetected]);

  if (!displayText || !displayText.length) {
    return null;
  }

  return (
    <Typography 
      variant="body1" 
      sx={{ 
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word' 
      }}
    >
      {displayText}
    </Typography>
  );
};
