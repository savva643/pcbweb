import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  List,
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
  Grade,
  Comment,
  Download,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ReviewAssignment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    score: 0,
    feedback: '',
  });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const assignmentRes = await axios.get(`${API_URL}/assignments/${id}`);
      setAssignment(assignmentRes.data);

      const submissionsRes = await axios.get(`${API_URL}/submissions?assignmentId=${id}`);
      setSubmissions(submissionsRes.data);
    } catch (error) {
      setError('Не удалось загрузить данные');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGrade = async (submissionId) => {
    try {
      await axios.post(`${API_URL}/submissions/${submissionId}/grade`, {
        score: gradeForm.score,
        maxScore: assignment.maxScore,
        feedback: gradeForm.feedback,
      });

      setGradeDialogOpen(false);
      setGradeForm({ score: 0, feedback: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось выставить оценку');
    }
  };

  const handleAddComment = async (submissionId) => {
    if (!commentText.trim()) return;

    try {
      await axios.post(`${API_URL}/submissions/${submissionId}/comments`, {
        content: commentText,
      });

      setCommentText('');
      fetchData();
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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Typography variant="h4">{assignment.title}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body1" paragraph>
            {assignment.description || 'Нет описания'}
          </Typography>
          {assignment.dueDate && (
            <Chip
              label={`Срок сдачи: ${new Date(assignment.dueDate).toLocaleDateString('ru-RU')}`}
              color="primary"
            />
          )}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Максимальный балл: {assignment.maxScore}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Отправленные работы ({submissions.length})
      </Typography>

      {submissions.length === 0 ? (
        <Alert severity="info">Пока нет отправленных работ</Alert>
      ) : (
        <List>
          {submissions.map((submission) => (
            <Card key={submission.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {submission.student.firstName} {submission.student.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {submission.student.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Отправлено: {new Date(submission.submittedAt).toLocaleString('ru-RU')}
                    </Typography>
                    <Chip
                      label={submission.status === 'GRADED' ? 'Оценено' : 'Ожидает проверки'}
                      color={submission.status === 'GRADED' ? 'success' : 'default'}
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      href={`${API_URL.replace('/api', '')}${submission.fileUrl}`}
                      target="_blank"
                      download
                    >
                      Скачать
                    </Button>
                    {submission.status !== 'GRADED' && (
                      <Button
                        variant="contained"
                        startIcon={<Grade />}
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setGradeForm({
                            score: 0,
                            feedback: '',
                          });
                          setGradeDialogOpen(true);
                        }}
                      >
                        Оценить
                      </Button>
                    )}
                  </Box>
                </Box>

                {submission.grade && (
                  <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Оценка: {submission.grade.score} / {submission.grade.maxScore}
                    </Typography>
                    {submission.grade.feedback && (
                      <Typography variant="body2">{submission.grade.feedback}</Typography>
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
                          <Typography variant="caption" color="text.secondary">
                            {comment.author.firstName} {comment.author.lastName} -{' '}
                            {new Date(comment.createdAt).toLocaleString('ru-RU')}
                          </Typography>
                          <Typography variant="body2">{comment.content}</Typography>
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
                          handleAddComment(submission.id);
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Comment />}
                      onClick={() => handleAddComment(submission.id)}
                      disabled={!commentText.trim()}
                    >
                      Отправить
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </List>
      )}

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Оценить работу: {selectedSubmission?.student.firstName} {selectedSubmission?.student.lastName}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Оценка"
            value={gradeForm.score}
            onChange={(e) => setGradeForm({ ...gradeForm, score: parseInt(e.target.value) || 0 })}
            margin="normal"
            inputProps={{ min: 0, max: assignment.maxScore }}
            helperText={`Максимум: ${assignment.maxScore} баллов`}
          />
          <TextField
            fullWidth
            label="Комментарий"
            value={gradeForm.feedback}
            onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            placeholder="Оставьте комментарий к работе..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => handleGrade(selectedSubmission?.id)}
            variant="contained"
            disabled={gradeForm.score < 0 || gradeForm.score > assignment.maxScore}
          >
            Выставить оценку
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewAssignment;

