import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const FinancialChat = ({ insights }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add initial insights as a system message
    if (insights) {
      setMessages([
        {
          type: 'system',
          content: insights,
          timestamp: new Date(),
        }
      ]);
    }
  }, [insights]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          context: insights,
        }),
      });

      const data = await response.json();
      
      setMessages(prev => [...prev, {
        type: 'ai',
        content: data.response,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          AI Financial Advisor
        </Typography>
      </Box>

      <Box sx={{ 
        flex: 1, 
        overflow: 'auto', 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column',
        gap: 2
      }}>
        {messages.map((message, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
              gap: 1,
              alignItems: 'flex-start',
            }}
          >
            <Avatar sx={{ bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main' }}>
              {message.type === 'user' ? <PersonIcon /> : <SmartToyIcon />}
            </Avatar>
            <Box
              sx={{
                maxWidth: '70%',
                bgcolor: message.type === 'user' ? 'primary.light' : 'grey.100',
                color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                p: 1.5,
                borderRadius: 2,
                boxShadow: 1,
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.content.split('\n').map((line, index) => {
                  if (line.trim().startsWith('###')) {
                    return (
                      <Typography key={index} variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
                        {line.replace('###', '').trim()}
                      </Typography>
                    );
                  }
                  if (line.trim().startsWith('-')) {
                    return (
                      <Typography key={index} variant="body1" sx={{ pl: 2, mb: 1 }}>
                        • {line.replace('-', '').trim()}
                      </Typography>
                    );
                  }
                  return (
                    <Typography key={index} variant="body1" sx={{ mb: 1 }}>
                      {line}
                    </Typography>
                  );
                })}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                {message.timestamp.toLocaleTimeString()}
              </Typography>
            </Box>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Avatar sx={{ bgcolor: 'secondary.main' }}>
              <SmartToyIcon />
            </Avatar>
            <CircularProgress size={20} />
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />
      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about your finances..."
          variant="outlined"
          size="small"
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default FinancialChat; 