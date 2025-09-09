import { FC, KeyboardEventHandler } from 'react';
import { IconButton, Popper, Paper, Typography, ClickAwayListener } from '@mui/material';
import TextField from '@mui/material/TextField';
import SendIcon from '@mui/icons-material/Send';
import { useCallback, useRef, useState, useMemo } from 'react';
import './SendMessageForm.css';
import { FileUpload } from '../FileUpload/FileUpload';

interface SendMessageFormProps {
  onFileUpload: (files: FileList) => void;
  onKeyUp: KeyboardEventHandler<HTMLInputElement>;
  onSubmit: (text: string) => void;
  disabled: boolean;
}

const SUGGESTION_PHRASES = [
  "I have an issue with my data roaming",
  "What is the M1 daily passport?",
  "what is the data passport and how much does it cost?",
  "I'd like to know about pricing information for the daily passport.",
  "I activated a daily passport but I'm not sure if it's active or not. How can I check that?",
  "Can you book a flight ticket for me?",
  "What types of roaming do you offer?",
  "How do I activate the daily passport?",
  "What are the charges per day?",
  "Why is there no network on my device?"
];

export const SendMessageForm: FC<SendMessageFormProps> = ({
  disabled,
  onFileUpload,
  onKeyUp,
  onSubmit,
}) => {
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = useMemo(() => {
    if (inputValue.length < 3) return [];
    
    return SUGGESTION_PHRASES.filter(phrase => 
      phrase.toLowerCase().includes(inputValue.toLowerCase().trim())
    ).map(phrase => {
      const lowerPhrase = phrase.toLowerCase();
      const lowerInput = inputValue.toLowerCase().trim();
      const matchIndex = lowerPhrase.indexOf(lowerInput);
      
      if (matchIndex === -1) return null;
      
      return {
        phrase,
        beforeMatch: phrase.substring(0, matchIndex),
        match: phrase.substring(matchIndex, matchIndex + inputValue.trim().length),
        afterMatch: phrase.substring(matchIndex + inputValue.trim().length)
      };
    }).filter(Boolean).slice(0, 4);
  }, [inputValue]);

  const handleSubmit = useCallback((customText?: string) => {
    if (disabled) {
      return;
    }

    const text = customText || textFieldRef.current?.value;
    if (text) {
      onSubmit(text);
    }

    if (textFieldRef.current) {
      textFieldRef.current.value = '';
      setInputValue('');
      setShowSuggestions(false);
    }
  }, [disabled, onSubmit]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setShowSuggestions(value.length >= 3);
  }, []);

  const handleSuggestionClick = useCallback((phrase: string) => {
    handleSubmit(phrase);
  }, [handleSubmit]);

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
      // Hide suggestions on Escape
      if (event.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
      
      // Prevent default Enter behavior when not holding Shift
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
      }
    },
    [],
  );

  return (
    <ClickAwayListener onClickAway={() => setShowSuggestions(false)}>
      <div ref={formRef} className="send-message-form" style={{ flexShrink: 0, position: 'relative' }}>
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
          onChange={handleInputChange}
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
        
        {/* Suggestions Popover */}
        <Popper
          open={showSuggestions && suggestions.length > 0}
          anchorEl={formRef.current}
          placement="top-start"
          style={{ zIndex: 1300 }}
          modifiers={[
            {
              name: 'offset',
              options: {
                offset: [0, 0],
              },
            },
          ]}
        >
          <Paper
            elevation={0}
            sx={{
              width: `${(formRef.current?.offsetWidth || 300) - 15}px`,
              border: '1px solid #e0e0e0',
              borderRadius: '0',
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.15)'
            }}
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                onClick={() => handleSuggestionClick(suggestion.phrase)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                  ':hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '14px',
                    lineHeight: '1.4',
                    color: '#333'
                  }}
                >
                  {suggestion.beforeMatch}
                  <strong>{suggestion.match}</strong>
                  {suggestion.afterMatch}
                </Typography>
              </div>
            ))}
          </Paper>
        </Popper>
        
        <FileUpload onFileUpload={onFileUpload} disabled={disabled} />
        <IconButton 
          onClick={() => handleSubmit()}
          sx={{ padding: '8px' }}
        >
          <SendIcon color="primary" />
        </IconButton>
      </div>
    </ClickAwayListener>
  );
};
