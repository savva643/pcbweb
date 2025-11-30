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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ArrowBack,
  Grade,
  Comment,
  ExpandMore,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ReviewTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    score: 0,
    feedback: '',
  });
  const [commentText, setCommentText] = useState('');

  const fetchData = React.useCallback(async () => {
    try {
      const [testRes, attemptsRes] = await Promise.all([
        axios.get(`${API_URL}/tests/${id}`),
        axios.get(`${API_URL}/tests/${id}/attempts/all`)
      ]);
      setTest(testRes.data);
      setAttempts(attemptsRes.data);
    } catch (error) {
      setError('Не удалось загрузить данные');
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGrade = async (attemptId) => {
    try {
      await axios.post(`${API_URL}/tests/attempts/${attemptId}/grade`, {
        score: gradeForm.score || null,
        feedback: gradeForm.feedback,
      });

      setGradeDialogOpen(false);
      setGradeForm({ score: 0, feedback: '' });
      fetchData();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось выставить оценку');
    }
  };

  const handleAddComment = async (attemptId) => {
    if (!commentText.trim()) return;

    try {
      await axios.post(`${API_URL}/tests/attempts/${attemptId}/comments`, {
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

  if (!test) {
    return <Alert severity="error">Тест не найден</Alert>;
  }

  const getFinalScore = (attempt) => {
    return attempt.teacherScore !== null && attempt.teacherScore !== undefined
      ? attempt.teacherScore
      : attempt.score;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Назад
        </Button>
        <Typography variant="h4">{test.title}</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {test.description && (
            <Typography variant="body1" paragraph>
              {test.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
            <Chip label={`Вопросов: ${test.questions.length}`} size="small" />
            <Chip label={`Макс. балл: ${test.maxScore}`} size="small" color="primary" />
            {test.difficulty && (
              <Chip
                label={`Сложность: ${test.difficulty === 'LOW' ? 'Низкая' : test.difficulty === 'MEDIUM' ? 'Средняя' : 'Высокая'}`}
                size="small"
                color={test.difficulty === 'LOW' ? 'success' : test.difficulty === 'MEDIUM' ? 'warning' : 'error'}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Попытки студентов ({attempts.length})
      </Typography>

      {attempts.length === 0 ? (
        <Alert severity="info">Пока нет попыток прохождения теста</Alert>
      ) : (
        <List>
          {attempts.map((attempt) => (
            <Card key={attempt.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6">
                      {attempt.student.firstName} {attempt.student.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {attempt.student.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Начато: {new Date(attempt.startedAt).toLocaleString('ru-RU')}
                      {attempt.completedAt && (
                        <> | Завершено: {new Date(attempt.completedAt).toLocaleString('ru-RU')}</>
                      )}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      {test.autoGrade ? (
                        <>
                          <Chip
                            label={`Автоматическая оценка: ${attempt.score} / ${attempt.maxScore}`}
                            size="small"
                            color={attempt.score === attempt.maxScore ? 'success' : 'default'}
                          />
                          {attempt.teacherScore !== null && attempt.teacherScore !== undefined && (
                            <Chip
                              label={`Оценка преподавателя: ${attempt.teacherScore} / ${attempt.maxScore}`}
                              size="small"
                              color="primary"
                            />
                          )}
                          <Chip
                            label={`Итоговая: ${getFinalScore(attempt)} / ${attempt.maxScore}`}
                            size="small"
                            color="success"
                          />
                        </>
                      ) : (
                        <>
                          <Chip
                            label={attempt.teacherScore !== null && attempt.teacherScore !== undefined 
                              ? `Оценка: ${attempt.teacherScore} / ${attempt.maxScore}`
                              : 'Требуется проверка'}
                            size="small"
                            color={attempt.teacherScore !== null && attempt.teacherScore !== undefined ? 'success' : 'warning'}
                          />
                          {attempt.score > 0 && (
                            <Chip
                              label={`Автоматическая оценка: ${attempt.score} / ${attempt.maxScore}`}
                              size="small"
                              color="default"
                            />
                          )}
                        </>
                      )}
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<Grade />}
                    onClick={() => {
                      setSelectedAttempt(attempt);
                      setGradeForm({
                        score: attempt.teacherScore !== null && attempt.teacherScore !== undefined ? attempt.teacherScore : attempt.score,
                        feedback: attempt.teacherFeedback || '',
                      });
                      setGradeDialogOpen(true);
                    }}
                  >
                    {attempt.teacherScore !== null ? 'Изменить оценку' : 'Оценить'}
                  </Button>
                </Box>

                {attempt.teacherFeedback && (
                  <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Комментарий преподавателя:
                    </Typography>
                    <Typography variant="body2">{attempt.teacherFeedback}</Typography>
                  </Paper>
                )}

                <Accordion sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography>Просмотр ответов</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {attempt.answers && attempt.answers.length > 0 ? (
                      <Box>
                        {attempt.answers.map((answer) => (
                          <Paper key={answer.id} sx={{ p: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              {answer.isCorrect ? (
                                <CheckCircle color="success" />
                              ) : (
                                <Cancel color="error" />
                              )}
                              <Typography variant="subtitle2" fontWeight="bold">
                                {answer.question.question}
                              </Typography>
                              <Chip
                                label={`${answer.points || 0} / ${answer.question.points} баллов`}
                                size="small"
                                color={answer.isCorrect ? 'success' : 'default'}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Ответ студента: {answer.textAnswer || answer.answerIds.map(aid => {
                                const ans = answer.question.answers.find(a => a.id === aid);
                                return ans ? ans.text : '';
                              }).filter(Boolean).join(', ')}
                            </Typography>
                          </Paper>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Ответы не найдены
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Комментарии ({attempt.comments?.length || 0})
                  </Typography>
                  {attempt.comments && attempt.comments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      {attempt.comments.map((comment) => (
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
                                      await axios.put(`${API_URL}/tests/attempts/${attempt.id}/comments/${comment.id}`, {
                                        content: newContent.trim(),
                                      });
                                      fetchData();
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
                          handleAddComment(attempt.id);
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      startIcon={<Comment />}
                      onClick={() => handleAddComment(attempt.id)}
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
          Оценить попытку: {selectedAttempt?.student.firstName} {selectedAttempt?.student.lastName}
        </DialogTitle>
        <DialogContent>
          {test.autoGrade && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Автоматическая оценка: {selectedAttempt?.score || 0} / {test.maxScore}
            </Typography>
          )}
          {!test.autoGrade && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Этот тест требует ручной проверки. Оцените ответы студента вручную.
            </Alert>
          )}
          <TextField
            fullWidth
            type="number"
            label="Оценка преподавателя (оставьте пустым для использования автоматической)"
            value={gradeForm.score}
            onChange={(e) => setGradeForm({ ...gradeForm, score: e.target.value ? parseInt(e.target.value) : null })}
            margin="normal"
            inputProps={{ min: 0, max: test.maxScore }}
            helperText={`Максимум: ${test.maxScore} баллов. Оставьте пустым, чтобы использовать автоматическую оценку.`}
          />
          <TextField
            fullWidth
            label="Комментарий"
            value={gradeForm.feedback}
            onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
            margin="normal"
            multiline
            rows={4}
            placeholder="Оставьте комментарий к попытке..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={() => handleGrade(selectedAttempt?.id)}
            variant="contained"
            disabled={gradeForm.score !== null && (gradeForm.score < 0 || gradeForm.score > test.maxScore)}
          >
            {selectedAttempt?.teacherScore !== null ? 'Изменить оценку' : 'Выставить оценку'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewTest;

