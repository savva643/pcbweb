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
  Divider,
  Paper,
} from '@mui/material';
import { Upload, Send } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAssignment();
  }, [id]);

  const fetchAssignment = async () => {
    try {
      const response = await axios.get(`${API_URL}/assignments/${id}`);
      setAssignment(response.data);
      if (response.data.mySubmission) {
        setSubmission(response.data.mySubmission);
      }
    } catch (error) {
      setError('Не удалось загрузить задание');
      console.error('Fetch assignment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      if (e.target.files[0].size > 100 * 1024 * 1024) {
        setError('Файл слишком большой (максимум 100 МБ)');
        return;
      }
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!file && !submission) {
      setError('Выберите файл для отправки');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignmentId', id);

      const response = await axios.post(`${API_URL}/submissions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSubmission(response.data);
      setFile(null);
      setSuccess('Задание успешно отправлено');
      fetchAssignment();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось отправить задание');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      await axios.post(`${API_URL}/submissions/${submission.id}/comments`, {
        content: comment,
      });
      setComment('');
      fetchAssignment();
    } catch (error) {
      setError('Не удалось добавить комментарий');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!assignment) {
    return <Alert severity="error">Задание не найдено</Alert>;
  }

  return (
    <Box>
      <Button onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        ← Назад к курсу
      </Button>

      <Card>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            {assignment.title}
          </Typography>
          {assignment.description && (
            <Typography variant="body1" paragraph>
              {assignment.description}
            </Typography>
          )}
          {assignment.dueDate && (
            <Chip
              label={`Срок сдачи: ${new Date(assignment.dueDate).toLocaleDateString('ru-RU')}`}
              color="primary"
              sx={{ mb: 2 }}
            />
          )}
        </CardContent>
      </Card>

      {user?.role === 'STUDENT' && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Отправить задание
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            {submission ? (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Задание уже отправлено
                </Alert>
                <Typography variant="body2" gutterBottom>
                  Статус: {submission.status === 'GRADED' ? 'Оценено' : 'Отправлено'}
                </Typography>
                {submission.fileUrl && (
                  <Button
                    variant="outlined"
                    href={`${API_URL.replace('/api', '')}${submission.fileUrl}`}
                    target="_blank"
                    download
                    sx={{ mt: 1 }}
                  >
                    Скачать отправленный файл
                  </Button>
                )}

                {submission.grade && (
                  <Paper sx={{ p: 2, mt: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h6" gutterBottom>
                      Оценка
                    </Typography>
                    <Typography variant="body1">
                      {submission.grade.score} / {submission.grade.maxScore}
                    </Typography>
                    {submission.grade.feedback && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {submission.grade.feedback}
                      </Typography>
                    )}
                  </Paper>
                )}

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                  Комментарии
                </Typography>
                {submission.comments && submission.comments.length > 0 ? (
                  <Box sx={{ mb: 2 }}>
                    {submission.comments.map((comment) => (
                      <Paper key={comment.id} sx={{ p: 2, mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {comment.author.firstName} {comment.author.lastName} -{' '}
                          {new Date(comment.createdAt).toLocaleString('ru-RU')}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {comment.content}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Комментариев пока нет
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Добавить комментарий..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={handleAddComment}
                    disabled={!comment.trim()}
                  >
                    Отправить
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <input
                  accept="*/*"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<Upload />}
                    sx={{ mb: 2 }}
                  >
                    {file ? file.name : 'Выбрать файл'}
                  </Button>
                </label>
                {file && (
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleSubmit}
                      disabled={submitting}
                      startIcon={<Send />}
                    >
                      {submitting ? 'Отправка...' : 'Отправить задание'}
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default AssignmentDetail;

