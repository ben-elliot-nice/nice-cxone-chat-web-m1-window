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

const SPECIFIC_MESSAGE = "Please select from one of the following options so I can better help you:";

export const MessageText: FC<MessageTextProps> = ({ 
  text, 
  messageId,
  onQuickReply,
  shouldHideQuickReplies = false,
  onQuickRepliesDetected
}) => {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    // Check if this is the specific message we want to handle
    if (text && text.includes(SPECIFIC_MESSAGE)) {
      // Remove the options list from the display text
      const lines = text.split('\n');
      const beforeOptions = [];
      let foundOptions = false;
      
      for (const line of lines) {
        if (line.trim().startsWith('- ')) {
          foundOptions = true;
          continue;
        }
        if (!foundOptions) {
          beforeOptions.push(line);
        }
      }
      
      setDisplayText(beforeOptions.join('\n').trim());
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
