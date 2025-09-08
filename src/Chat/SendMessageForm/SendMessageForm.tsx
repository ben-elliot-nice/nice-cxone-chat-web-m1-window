import { FC, KeyboardEventHandler } from 'react';
import { IconButton } from '@mui/material';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import { useCallback, useRef } from 'react';
import './SendMessageForm.css';
import { FileUpload } from '../FileUpload/FileUpload';

interface SendMessageFormProps {
  onFileUpload: (files: FileList) => void;
  onKeyUp: KeyboardEventHandler<HTMLInputElement>;
  onSubmit: (text: string) => void;
  disabled: boolean;
}

export const SendMessageForm: FC<SendMessageFormProps> = ({
  disabled,
  onFileUpload,
  onKeyUp,
  onSubmit,
}) => {
  const textFieldRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    if (disabled) {
      return;
    }

    const text = textFieldRef.current?.value;
    if (text) {
      onSubmit(text);
    }

    if (textFieldRef.current) {
      textFieldRef.current.value = '';
    }
  }, [disabled, onSubmit]);

  const handleKeyUp = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Submit on Enter without Shift key
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSubmit();
        return;
      }
      return onKeyUp(event as any);
    },
    [handleSubmit, onKeyUp],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Prevent default Enter behavior when not holding Shift
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
      }
    },
    [],
  );

  return (
    <div className="send-message-form" style={{ flexShrink: 0 }}>
      <TextField
        data-testid="send-message-form-text-input"
        className="send-message-form-text-input"
        disabled={disabled}
        inputRef={textFieldRef}
        placeholder="Type your question ..."
        variant="outlined"
        color="primary"
        fullWidth
        multiline
        maxRows={3}
        InputProps={{
          onKeyUp: handleKeyUp,
          onKeyDown: handleKeyDown,
          sx: {
            padding: '8px 12px !important',
            '& textarea': {
              resize: 'none',
              overflow: 'hidden',
              padding: '0 !important',
              lineHeight: '1.4',
              fontSize: '14px',
              minHeight: '20px !important',
              height: '20px !important',
            },
          },
        }}
      />
      <FileUpload onFileUpload={onFileUpload} disabled={disabled} />
      <IconButton 
        onClick={handleSubmit}
        sx={{ padding: '8px' }}
      >
        <SendIcon color="primary" />
      </IconButton>
    </div>
  );
};
