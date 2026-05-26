import React, { FC } from 'react';
import { Typography, Button, Box } from '@mui/material';

interface HotTopicsProps {
  onTopicClick: (topic: string) => void;
}

const hotTopics = [
  "⏳ be part of what's next",
  "⚠️ Scam Alert: Steps to Take", 
  "💭 Know more about eSIM",
  "🧳 Roam with M1 Daily Passport!",
  "📢 M1 + SIMBA : an important message"
];

export const HotTopics: FC<HotTopicsProps> = ({ onTopicClick }) => {
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
        Hot Topics
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {hotTopics.map((topic, index) => (
          <Button
            key={index}
            onClick={() => onTopicClick(topic)}
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
            {topic}
          </Button>
        ))}
      </Box>
    </Box>
  );
};