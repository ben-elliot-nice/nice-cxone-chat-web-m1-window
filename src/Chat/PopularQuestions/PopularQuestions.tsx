import React, { FC } from 'react';
import { Typography, Button, Box } from '@mui/material';

interface PopularQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const popularQuestions = [
  "Transition Your M1 Service with Ease!",
  "Billing & Payment for Your Bespoke Plan"
];

export const PopularQuestions: FC<PopularQuestionsProps> = ({ onQuestionClick }) => {
  return (
    <Box sx={{ width: '100%' }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontSize: '12px',
          fontWeight: 500,
          color: '#000',
          marginBottom: '6px',
          paddingBottom: '3px',
          borderBottom: '1px solid #c4d1d8'
        }}
      >
        Popular Questions
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {popularQuestions.map((question, index) => (
          <Button
            key={index}
            onClick={() => onQuestionClick(question)}
            sx={{
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              padding: '3px 0',
              color: '#333',
              fontSize: '12px',
              justifyContent: 'flex-start',
              textTransform: 'none',
              minHeight: 'auto',
              '&:hover': {
                backgroundColor: 'transparent',
                color: '#144271'
              }
            }}
          >
            {question}
          </Button>
        ))}
      </Box>
    </Box>
  );
};