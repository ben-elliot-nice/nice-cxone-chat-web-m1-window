import React, { FC } from 'react';
import { Button, Box } from '@mui/material';

interface QuickReplyOptionsProps {
  options: string[];
  onOptionClick: (option: string) => void;
}

export const QuickReplyOptions: FC<QuickReplyOptionsProps> = ({ options, onOptionClick }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexWrap: 'wrap',
      gap: '4px', 
      maxWidth: '100%'
    }}>
      {options.map((option, index) => (
        <Button
          key={index}
          variant="outlined"
          size="small"
          onClick={() => onOptionClick(option)}
          sx={{
            textTransform: 'none',
            borderColor: '#ff9e1b',
            color: '#ff9e1b',
            fontSize: '0.875rem',
            padding: '6px 12px',
            borderRadius: '12px',
            minWidth: 'auto',
            width: 'fit-content',
            flexShrink: 0,
            '&:hover': {
              backgroundColor: 'rgba(255, 158, 27, 0.1)',
              borderColor: '#ff9e1b',
            },
          }}
        >
          {option}
        </Button>
      ))}
    </Box>
  );
};