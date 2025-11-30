import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Send,
  Add,
  Chat as ChatIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const GroupChat = ({ groupId, user }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTopics();
  }, [groupId]);

  useEffect(() => {
    if (selectedTopic) {
      fetchMessages(selectedTopic.id);
      const interval = setInterval(() => {
        fetchMessages(selectedTopic.id);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedTopic]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/group/${groupId}/topics`);
      setTopics(response.data);
      if (response.data.length > 0 && !selectedTopic) {
        setSelectedTopic(response.data[0]);
      }
    } catch (error) {
      console.error('Fetch topics error:', error);
    }
  };

  const fetchMessages = async (topicId) => {
    try {
      const response = await axios.get(`${API_URL}/chat/topics/${topicId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Fetch messages error:', error);
    }
  };

  const handleCreateTopic = async () => {
    try {
      await axios.post(`${API_URL}/chat/group/${groupId}/topics`, {
        title: newTopicTitle,
        description: newTopicDescription
      });
      setTopicDialogOpen(false);
      setNewTopicTitle('');
      setNewTopicDescription('');
      fetchTopics();
    } catch (error) {
      console.error('Create topic error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTopic) return;

    try {
      await axios.post(`${API_URL}/chat/topics/${selectedTopic.id}/messages`, {
        content: newMessage
      });
      setNewMessage('');
      fetchMessages(selectedTopic.id);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, height: { xs: 'auto', sm: '600px' }, minHeight: { xs: '500px', sm: '600px' } }}>
      <Box sx={{ 
        width: { xs: '100%', sm: 300 }, 
        height: { xs: '200px', sm: 'auto' },
        borderRight: { xs: 0, sm: 1 }, 
        borderBottom: { xs: 1, sm: 0 },
        borderColor: 'divider', 
        overflow: 'auto' 
      }}>
        <Box sx={{ 
          p: { xs: 1, sm: 2 }, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center' 
        }}>
          <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
            Темы
          </Typography>
          <IconButton size="small" onClick={() => setTopicDialogOpen(true)}>
            <Add />
          </IconButton>
        </Box>
        <List>
          {topics.map((topic) => (
            <ListItem
              key={topic.id}
              button
              selected={selectedTopic?.id === topic.id}
              onClick={() => setSelectedTopic(topic)}
            >
              <ListItemAvatar>
                <Avatar>
                  <ChatIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={topic.title}
                secondary={topic._count?.messages || 0}
              />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: { xs: '400px', sm: 'auto' } }}>
        {selectedTopic ? (
          <>
            <Paper sx={{ p: { xs: 1, sm: 2 }, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                {selectedTopic.title}
              </Typography>
              {selectedTopic.description && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {selectedTopic.description}
                </Typography>
              )}
            </Paper>
            <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, sm: 2 } }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: message.authorId === user?.id ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: message.authorId === user?.id ? 'primary.main' : 'grey.200',
                      color: message.authorId === user?.id ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                      {message.author.firstName} {message.author.lastName}
                    </Typography>
                    <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {message.content}
                    </Typography>
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.7, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      {new Date(message.createdAt).toLocaleString('ru-RU')}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ 
              p: { xs: 1, sm: 2 }, 
              borderTop: 1, 
              borderColor: 'divider', 
              display: 'flex', 
              gap: 1 
            }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Введите сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              />
              <Button variant="contained" onClick={handleSendMessage} sx={{ minWidth: { xs: 48, sm: 64 } }}>
                <Send />
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Alert severity="info">Выберите тему для общения</Alert>
          </Box>
        )}
      </Box>

      <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать тему</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={newTopicDescription}
            onChange={(e) => setNewTopicDescription(e.target.value)}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopicDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleCreateTopic}
            variant="contained"
            disabled={!newTopicTitle.trim()}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupChat;

