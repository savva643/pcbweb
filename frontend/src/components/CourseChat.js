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
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Autocomplete,
} from '@mui/material';
import {
  Send,
  Add,
  Delete,
  Edit,
  Chat as ChatIcon,
  Lock,
  Person,
  Message,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CourseChat = ({ courseId, user, course }) => {
  const [topics, setTopics] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [personalChatDialogOpen, setPersonalChatDialogOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    fetchTopics();
    if (user?.role === 'TEACHER') {
      fetchStudents();
    }
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

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API_URL}/teacher/courses/${courseId}/students`);
      setStudents(response.data);
    } catch (error) {
      console.error('Fetch students error:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${API_URL}/chat/course/${courseId}/topics`);
      const topicsData = response.data;
      
      // Сортируем: личные чаты первыми, потом публичные
      const personalChats = topicsData.filter(t => t.isPrivate && t.participantId);
      const publicTopics = topicsData.filter(t => !t.isPrivate);
      const sortedTopics = [...personalChats, ...publicTopics];
      
      setTopics(sortedTopics);
      
      // Если есть темы, выбираем первую (личный чат для студента или первая тема)
      if (sortedTopics.length > 0 && !selectedTopic) {
        setSelectedTopic(sortedTopics[0]);
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

  const handleCreatePersonalChat = async () => {
    try {
      const response = await axios.post(`${API_URL}/chat/course/${courseId}/personal-chat`, {
        participantId: user?.role === 'TEACHER' ? selectedStudentId : undefined
      });
      
      const newChat = response.data;
      
      // Проверяем, нет ли уже этого чата в списке
      if (!topics.find(t => t.id === newChat.id)) {
        setTopics([newChat, ...topics]);
      }
      
      setSelectedTopic(newChat);
      setPersonalChatDialogOpen(false);
      setSelectedStudentId('');
    } catch (error) {
      setError('Не удалось создать личный чат');
      console.error('Create personal chat error:', error);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/chat/course/${courseId}/topics`, {
        title: newTopicTitle,
        description: newTopicDescription,
        isPrivate: false,
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

  const handleContextMenu = (event, messageId) => {
    event.preventDefault();
    setContextMenu(
      contextMenu === null
        ? {
            mouseX: event.clientX + 2,
            mouseY: event.clientY - 6,
          }
        : null,
    );
    setSelectedMessageId(messageId);
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
    setSelectedMessageId(null);
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessageId) return;

    try {
      await axios.delete(`${API_URL}/chat/messages/${selectedMessageId}`);
      setMessages(messages.filter((m) => m.id !== selectedMessageId));
      handleCloseContextMenu();
    } catch (error) {
      setError('Не удалось удалить сообщение');
      console.error('Delete message error:', error);
      handleCloseContextMenu();
    }
  };

  const canDeleteMessage = (message) => {
    return message.author.id === user.id;
  };

  const getTopicTitle = (topic) => {
    if (topic.isPrivate && topic.participantId) {
      if (user?.role === 'STUDENT') {
        return 'Чат с преподавателем';
      } else {
        // Для преподавателя нужно найти имя студента
        const student = students.find(s => s.id === topic.participantId);
        return student ? `Чат со студентом: ${student.firstName} ${student.lastName}` : 'Личный чат';
      }
    }
    return topic.title;
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
            <Typography variant="h6">Обсуждения</Typography>
            <Box>
              {user?.role === 'TEACHER' && (
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setPersonalChatDialogOpen(true)}
                  sx={{ mr: 1 }}
                  title="Создать личный чат"
                >
                  <Person />
                </IconButton>
              )}
              {user?.role === 'STUDENT' && (
                <IconButton
                  size="small"
                  color="primary"
                  onClick={async () => {
                    try {
                      const response = await axios.post(`${API_URL}/chat/course/${courseId}/personal-chat`, {});
                      const newChat = response.data;
                      if (!topics.find(t => t.id === newChat.id)) {
                        setTopics([newChat, ...topics]);
                      }
                      setSelectedTopic(newChat);
                    } catch (error) {
                      setError('Не удалось создать личный чат');
                      console.error('Create personal chat error:', error);
                    }
                  }}
                  sx={{ mr: 1 }}
                  title="Написать преподавателю"
                >
                  <Message />
                </IconButton>
              )}
              <IconButton
                size="small"
                color="primary"
                onClick={() => setTopicDialogOpen(true)}
                title="Создать тему"
              >
                <Add />
              </IconButton>
            </Box>
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
                    {topic.isPrivate && topic.participantId ? <Person /> : topic.isPrivate ? <Lock /> : <ChatIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getTopicTitle(topic)}
                      {topic.isPrivate && topic.participantId && (
                        <Chip
                          label="Личный"
                          size="small"
                          color="secondary"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                      {topic.isPrivate && !topic.participantId && (
                        <Chip
                          label="Приватная"
                          size="small"
                          color="secondary"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                    </Box>
                  }
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Typography variant="h6">
                  {getTopicTitle(selectedTopic)}
                </Typography>
                {selectedTopic.isPrivate && selectedTopic.participantId && (
                  <Chip
                    icon={<Person />}
                    label="Личный чат"
                    size="small"
                    color="secondary"
                  />
                )}
                {selectedTopic.isPrivate && !selectedTopic.participantId && (
                  <Chip
                    icon={<Lock />}
                    label="Приватная тема"
                    size="small"
                    color="secondary"
                  />
                )}
              </Box>
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
                            onContextMenu={(e) => canDeleteMessage(message) && handleContextMenu(e, message.id)}
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
                                cursor: canDeleteMessage(message) ? 'context-menu' : 'default',
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
                          </Box>
                        )}
                        {!showAvatar && (
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                              mb: 1,
                            }}
                            onContextMenu={(e) => canDeleteMessage(message) && handleContextMenu(e, message.id)}
                          >
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: '70%',
                                ml: isOwnMessage ? 0 : 5,
                                mr: isOwnMessage ? 5 : 0,
                                bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                                color: isOwnMessage ? 'white' : 'text.primary',
                                cursor: canDeleteMessage(message) ? 'context-menu' : 'default',
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

      {/* Контекстное меню */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {selectedMessageId && messages.find(m => m.id === selectedMessageId)?.author.id === user.id && (
          <MenuItem onClick={handleDeleteMessage}>
            <Delete fontSize="small" sx={{ mr: 1 }} />
            Удалить сообщение
          </MenuItem>
        )}
      </Menu>

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

      {/* Диалог создания личного чата (для преподавателя) */}
      {user?.role === 'TEACHER' && (
        <Dialog open={personalChatDialogOpen} onClose={() => setPersonalChatDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Создать личный чат со студентом</DialogTitle>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Выберите студента</InputLabel>
              <Select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                label="Выберите студента"
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} ({student.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPersonalChatDialogOpen(false)}>Отмена</Button>
            <Button
              onClick={handleCreatePersonalChat}
              variant="contained"
              disabled={!selectedStudentId}
            >
              Создать чат
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError('')} 
          sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CourseChat;
