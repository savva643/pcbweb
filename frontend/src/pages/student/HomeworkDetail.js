import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Upload,
  Download,
  CheckCircle,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const HomeworkDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [homework, setHomework] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchHomework();
  }, [id]);

  const fetchHomework = async () => {
    try {
      const response = await axios.get(`${API_URL}/homeworks/${id}`);
      setHomework(response.data);
      
      // Находим отправку текущего студента
      const mySubmission = response.data.submissions?.find(s => s.studentId === user?.id);
      setSubmission(mySubmission || null);
    } catch (error) {
      setError('Не удалось загрузить домашнее задание');
      console.error('Fetch homework error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Выберите файл для отправки');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileUrl', ''); // Будет установлен на сервере

      const uploadResponse = await axios.post(
        `${API_URL}/homeworks/${id}/submit`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSubmission(uploadResponse.data);
      setFile(null);
      fetchHomework();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось отправить домашнее задание');
      console.error('Submit homework error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !submission) return;

    try {
      await axios.post(`${API_URL}/homeworks/submissions/${submission.id}/comments`, {
        content: commentText.trim(),
      });

      setCommentText('');
      fetchHomework();
    } catch (error) {
      setError('Не удалось добавить комментарий');
      console.error('Add comment error:', error);
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'LOW':
        return 'Низкая';
      case 'MEDIUM':
        return 'Средняя';
      case 'HIGH':
        return 'Высокая';
      default:
        return difficulty;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !homework) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Назад
        </Button>
      </Box>
    );
  }

  if (!homework) {
    return <Alert severity="error">Домашнее задание не найдено</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Typography variant="h4">{homework.title}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {homework.description && (
            <Typography variant="body1" paragraph>
              {homework.description}
            </Typography>
          )}
          
          {homework.instructions && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Инструкции по выполнению:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {homework.instructions}
              </Typography>
            </Box>
          )}

          {homework.requirements && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Требования:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {homework.requirements}
              </Typography>
            </Box>
          )}

          {homework.resources && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Ресурсы и материалы:
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {homework.resources}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            {homework.dueDate && (
              <Chip
                label={`Срок сдачи: ${new Date(homework.dueDate).toLocaleString('ru-RU')}`}
                size="small"
                color={new Date(homework.dueDate) < new Date() ? 'error' : 'default'}
              />
            )}
            <Chip
              label={`Макс. балл: ${homework.maxScore}`}
              size="small"
              color="primary"
            />
            {homework.difficulty && (
              <Chip
                label={`Сложность: ${getDifficultyLabel(homework.difficulty)}`}
                size="small"
                color={getDifficultyColor(homework.difficulty)}
              />
            )}
            <Chip
              label={homework.isActive ? 'Активно' : 'Закрыто'}
              size="small"
              color={homework.isActive ? 'success' : 'default'}
            />
          </Box>
        </CardContent>
      </Card>

      {submission ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Ваша отправка
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Отправлено: {new Date(submission.submittedAt).toLocaleString('ru-RU')}
                </Typography>
                <Chip
                  label={submission.status === 'GRADED' ? 'Оценено' : submission.status === 'SUBMITTED' ? 'Отправлено' : 'Ожидает проверки'}
                  color={submission.status === 'GRADED' ? 'success' : submission.status === 'SUBMITTED' ? 'info' : 'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
              <Button
                variant="outlined"
                startIcon={<Download />}
                href={`${API_URL.replace('/api', '')}${submission.fileUrl}`}
                target="_blank"
                download
              >
                Скачать файл
              </Button>
            </Box>

            {submission.grade && (
              <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Оценка: {submission.grade.score} / {submission.grade.maxScore}
                </Typography>
                {submission.grade.feedback && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {submission.grade.feedback}
                  </Typography>
                )}
              </Paper>
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Комментарии ({submission.comments?.length || 0})
              </Typography>
              {submission.comments && submission.comments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {submission.comments.map((comment) => (
                    <Paper key={comment.id} sx={{ p: 1, mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            {comment.author.firstName} {comment.author.lastName} -{' '}
                            {new Date(comment.createdAt).toLocaleString('ru-RU')}
                            {comment.updatedAt && comment.updatedAt !== comment.createdAt && ' (изменено)'}
                          </Typography>
                          <Typography variant="body2">{comment.content}</Typography>
                        </Box>
                        {comment.authorId === user?.id && (
                          <Button
                            size="small"
                            onClick={async () => {
                              const newContent = window.prompt('Изменить комментарий:', comment.content);
                              if (newContent && newContent.trim() && newContent !== comment.content) {
                                try {
                                  await axios.put(`${API_URL}/homeworks/submissions/${submission.id}/comments/${comment.id}`, {
                                    content: newContent.trim(),
                                  });
                                  fetchHomework();
                                } catch (error) {
                                  setError('Не удалось изменить комментарий');
                                }
                              }
                            }}
                          >
                            Изменить
                          </Button>
                        )}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Добавить комментарий..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                >
                  Отправить
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Отправить домашнее задание
            </Typography>
            {!homework.isActive && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Это домашнее задание закрыто и больше недоступно для отправки
              </Alert>
            )}
            <input
              type="file"
              onChange={handleFileChange}
              style={{ marginTop: 16, marginBottom: 16 }}
              disabled={!homework.isActive}
            />
            {file && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Выбран файл: {file.name}
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<Upload />}
              onClick={handleSubmit}
              disabled={!file || uploading || !homework.isActive}
            >
              {uploading ? 'Отправка...' : 'Отправить'}
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default HomeworkDetail;

