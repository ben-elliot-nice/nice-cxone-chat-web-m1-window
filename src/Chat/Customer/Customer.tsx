import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TopicIcon from '@mui/icons-material/Topic';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
  Box,
  Chip,
  Tooltip,
} from '@mui/material';
import { FC, useCallback, useRef, useState } from 'react';

interface CustomerProps {
  onChange: (name: string) => void;
  name?: string;
  threadName?: string;
  onThreadNameChange?: (name: string) => void;
}

export const Customer: FC<CustomerProps> = ({ name, onChange, threadName, onThreadNameChange }) => {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const threadNameInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [threadDialogOpen, setThreadDialogOpen] = useState(false);
  
  const handleDialogOpenClick = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleThreadDialogOpenClick = useCallback(() => {
    setThreadDialogOpen(true);
  }, []);

  const handleOnClose = useCallback(() => setDialogOpen(false), []);
  const handleThreadOnClose = useCallback(() => setThreadDialogOpen(false), []);
  
  const handleSubmit = useCallback(() => {
    const newName = nameInputRef.current?.value;
    onChange(newName ?? '');
    handleOnClose();
  }, [handleOnClose, onChange]);

  const handleThreadSubmit = useCallback(() => {
    const newThreadName = threadNameInputRef.current?.value;
    if (onThreadNameChange && newThreadName) {
      onThreadNameChange(newThreadName);
    }
    handleThreadOnClose();
  }, [handleThreadOnClose, onThreadNameChange]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleThreadKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleThreadSubmit();
    }
  }, [handleThreadSubmit]);

  return (
    <>
      {/* Customer Name Dialog */}
      <Dialog open={dialogOpen} onClose={handleOnClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          {name ? 'Update Your Name' : 'Enter Your Name'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            {name 
              ? 'Change how you appear to agents in this chat.'
              : 'Please enter your name to start the conversation. This helps agents provide you with personalized support.'}
          </DialogContentText>
          <TextField
            inputRef={nameInputRef}
            defaultValue={name}
            autoFocus
            fullWidth
            label="Your Name"
            placeholder="Enter your name here"
            variant="outlined"
            onKeyPress={handleKeyPress}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleOnClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {name ? 'Update' : 'Set Name'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Thread Name Dialog */}
      <Dialog open={threadDialogOpen} onClose={handleThreadOnClose} maxWidth="xs" fullWidth>
        <DialogTitle>
          {threadName ? 'Update Conversation Name' : 'Name This Conversation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Give this conversation a meaningful name to help you find it later.
          </DialogContentText>
          <TextField
            inputRef={threadNameInputRef}
            defaultValue={threadName}
            autoFocus
            fullWidth
            label="Conversation Name"
            placeholder="e.g., Account Issue, Product Question"
            variant="outlined"
            onKeyPress={handleThreadKeyPress}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleThreadOnClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleThreadSubmit} variant="contained" color="primary">
            {threadName ? 'Update' : 'Set Name'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        p: 1,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}>
        {/* Customer Name Chip */}
        {name ? (
          <Tooltip title="Click to change your name">
            <Chip
              icon={<AccountCircleIcon />}
              label={name}
              onClick={handleDialogOpenClick}
              onDelete={handleDialogOpenClick}
              deleteIcon={<EditIcon fontSize="small" />}
              variant="outlined"
              color="primary"
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'primary.main',
                },
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            />
          </Tooltip>
        ) : (
          <Tooltip title="Set your name to start chatting">
            <Button
              startIcon={<PersonAddIcon />}
              onClick={handleDialogOpenClick}
              variant="outlined"
              size="small"
              sx={{
                textTransform: 'none',
                borderStyle: 'dashed',
                '&:hover': {
                  borderStyle: 'solid',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              Set Your Name
            </Button>
          </Tooltip>
        )}
        
        {/* Thread Name Chip - Only show if onThreadNameChange is provided */}
        {onThreadNameChange && (
          <Tooltip title={threadName ? "Click to rename this conversation" : "Click to name this conversation"}>
            <Chip
              icon={<TopicIcon />}
              label={threadName || 'Unnamed Conversation'}
              onClick={handleThreadDialogOpenClick}
              onDelete={handleThreadDialogOpenClick}
              deleteIcon={<EditIcon fontSize="small" />}
              variant={threadName ? "outlined" : "filled"}
              color={threadName ? "secondary" : "default"}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: threadName ? 'secondary.main' : 'action.selected',
                },
                fontSize: '0.875rem',
                fontWeight: threadName ? 500 : 400,
                fontStyle: threadName ? 'normal' : 'italic',
              }}
            />
          </Tooltip>
        )}
        
        {!name && (
          <Typography variant="caption" color="text.secondary">
            Required to start chat
          </Typography>
        )}
      </Box>
    </>
  );
};
