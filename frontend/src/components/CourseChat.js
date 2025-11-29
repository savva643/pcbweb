import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Send,
  Add,
  Delete,
  Edit,
  Chat as ChatIcon,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CourseChat = ({ courseId, user }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    fetchTopics();
  }, [courseId]);

  useEffect(() => {
    if (selectedTopic) {
      fetchMessages(selectedTopic.id);
      // Polling для новых сообщений
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
      const response = await axios.get(`${API_URL}/chat/course/${courseId}/topics`);
      setTopics(response.data);
      if (response.data.length > 0 && !selectedTopic) {
        setSelectedTopic(response.data[0]);
      }
    } catch (error) {
      setError('Не удалось загрузить темы');
      console.error('Fetch topics error:', error);
    } finally {
      setLoading(false);
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
    if (!newTopicTitle.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/chat/course/${courseId}/topics`, {
        title: newTopicTitle,
        description: newTopicDescription,
      });
      setTopics([...topics, response.data]);
      setSelectedTopic(response.data);
      setTopicDialogOpen(false);
      setNewTopicTitle('');
      setNewTopicDescription('');
    } catch (error) {
      setError('Не удалось создать тему');
      console.error('Create topic error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTopic) return;

    try {
      const response = await axios.post(
        `${API_URL}/chat/topics/${selectedTopic.id}/messages`,
        { content: newMessage }
      );
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      setError('Не удалось отправить сообщение');
      console.error('Send message error:', error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await axios.delete(`${API_URL}/chat/messages/${messageId}`);
      setMessages(messages.filter((m) => m.id !== messageId));
    } catch (error) {
      setError('Не удалось удалить сообщение');
      console.error('Delete message error:', error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '600px', gap: 2 }}>
      {/* Список тем */}
      <Card sx={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Темы обсуждения</Typography>
            <IconButton
              size="small"
              color="primary"
              onClick={() => setTopicDialogOpen(true)}
            >
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
                sx={{
                  borderRadius: 1,
                  mb: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar>
                    <ChatIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={topic.title}
                  secondary={
                    <Typography variant="caption" noWrap>
                      {topic._count?.messages || topic.messageCount || 0} сообщений
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Чат */}
      <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedTopic ? (
          <>
            <CardContent sx={{ flexGrow: 1, overflow: 'auto', p: 2 }} ref={messagesContainerRef}>
              <Typography variant="h6" gutterBottom>
                {selectedTopic.title}
              </Typography>
              {selectedTopic.description && (
                <Typography variant="body2" color="text.secondary" paragraph>
                  {selectedTopic.description}
                </Typography>
              )}
              <Divider sx={{ my: 2 }} />
              {messages.length === 0 ? (
                <Alert severity="info">Нет сообщений. Начните обсуждение!</Alert>
              ) : (
                <List>
                  {messages.map((message, index) => {
                    const isOwnMessage = message.author.id === user.id;
                    const showAvatar = index === 0 || messages[index - 1].author.id !== message.author.id;

                    return (
                      <Box key={message.id}>
                        {showAvatar && (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                              mb: 1,
                            }}
                          >
                            {!isOwnMessage && (
                              <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                                {message.author.firstName[0]}
                              </Avatar>
                            )}
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: '70%',
                                bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                                color: isOwnMessage ? 'white' : 'text.primary',
                              }}
                            >
                              {!isOwnMessage && (
                                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                                  {message.author.firstName} {message.author.lastName}
                                  {message.author.role === 'TEACHER' && (
                                    <Chip
                                      label="Преподаватель"
                                      size="small"
                                      sx={{ ml: 1, height: 16, fontSize: '0.65rem' }}
                                    />
                                  )}
                                </Typography>
                              )}
                              <Typography variant="body1">{message.content}</Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  opacity: 0.7,
                                }}
                              >
                                {new Date(message.createdAt).toLocaleString('ru-RU')}
                              </Typography>
                            </Paper>
                            {isOwnMessage && (
                              <Avatar sx={{ width: 32, height: 32, ml: 1 }}>
                                {message.author.firstName[0]}
                              </Avatar>
                            )}
                            {isOwnMessage && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMessage(message.id)}
                                sx={{ ml: 1 }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )}
                        {!showAvatar && (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                              mb: 1,
                            }}
                          >
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: '70%',
                                ml: isOwnMessage ? 0 : 5,
                                mr: isOwnMessage ? 5 : 0,
                                bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                                color: isOwnMessage ? 'white' : 'text.primary',
                              }}
                            >
                              <Typography variant="body1">{message.content}</Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  display: 'block',
                                  mt: 0.5,
                                  opacity: 0.7,
                                }}
                              >
                                {new Date(message.createdAt).toLocaleString('ru-RU')}
                              </Typography>
                            </Paper>
                            {isOwnMessage && (
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMessage(message.id)}
                                sx={{ ml: 1 }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </List>
              )}
            </CardContent>
            <Divider />
            <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Написать сообщение..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                multiline
                maxRows={3}
              />
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                Отправить
              </Button>
            </Box>
          </>
        ) : (
          <CardContent>
            <Alert severity="info">
              Выберите тему обсуждения или создайте новую
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Диалог создания темы */}
      <Dialog open={topicDialogOpen} onClose={() => setTopicDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать новую тему</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название темы"
            value={newTopicTitle}
            onChange={(e) => setNewTopicTitle(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание (необязательно)"
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

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ position: 'fixed', bottom: 16, right: 16 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CourseChat;

