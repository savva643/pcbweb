import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Send,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [textAnswers, setTextAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchTest();
  }, [id]);

  useEffect(() => {
    const currentAttempt = attempt || test?.myAttempt;
    if (currentAttempt && test?.timeLimit && !currentAttempt.completedAt) {
      const startTime = new Date(currentAttempt.startedAt).getTime();
      const timeLimitMs = test.timeLimit * 60 * 1000;
      const endTime = startTime + timeLimitMs;

      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        
        if (remaining === 0) {
          handleAutoSubmit();
          clearInterval(interval);
        } else {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [attempt, test]);

  const fetchTest = async () => {
    try {
      const testRes = await axios.get(`${API_URL}/tests/${id}`);
      setTest(testRes.data);
      
      // Пытаемся найти существующую попытку
      let attemptRes = null;
      try {
        const existingAttempts = await axios.get(`${API_URL}/tests/${id}/attempts`);
        if (existingAttempts.data && existingAttempts.data.length > 0) {
          const myAttempt = existingAttempts.data.find(a => !a.completedAt);
          if (myAttempt) {
            attemptRes = { data: myAttempt };
          }
        }
      } catch (e) {
        // Игнорируем ошибку
      }

      if (!attemptRes) {
        // Создаем новую попытку
        try {
          const newAttempt = await axios.post(`${API_URL}/tests/${id}/start`);
          attemptRes = { data: newAttempt.data };
        } catch (error) {
          if (error.response?.status === 400 && error.response?.data?.error?.includes('already completed')) {
            // Тест уже пройден, получаем последнюю попытку
            const attempts = await axios.get(`${API_URL}/tests/${id}/attempts`);
            if (attempts.data && attempts.data.length > 0) {
              attemptRes = { data: attempts.data[0] };
            }
          } else {
            throw error;
          }
        }
      }

      setTest(testRes.data);
      
      if (attemptRes.data) {
        setAttempt(attemptRes.data);
        // Загружаем сохраненные ответы если есть
        if (attemptRes.data.answers) {
          const savedAnswers = {};
          const savedTextAnswers = {};
          attemptRes.data.answers.forEach(answer => {
            if (answer.textAnswer) {
              savedTextAnswers[answer.questionId] = answer.textAnswer;
            } else {
              savedAnswers[answer.questionId] = answer.answerIds || [];
            }
          });
          setAnswers(savedAnswers);
          setTextAnswers(savedTextAnswers);
        }
      } else {
        // Создаем новую попытку
        const newAttempt = await axios.post(`${API_URL}/tests/${id}/start`);
        setAttempt(newAttempt.data);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось загрузить тест');
      console.error('Fetch test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answerIds) => {
    setAnswers({
      ...answers,
      [questionId]: answerIds
    });
  };

  const handleTextAnswerChange = (questionId, text) => {
    setTextAnswers({
      ...textAnswers,
      [questionId]: text
    });
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await handleSubmit(true);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (submitting) return;
    
    setSubmitting(true);
    setError('');

    try {
      const answerArray = test.questions.map(question => {
        if (question.type === 'text_input') {
          return {
            questionId: question.id,
            textAnswer: textAnswers[question.id] || '',
            answerIds: []
          };
        } else {
          return {
            questionId: question.id,
            answerIds: answers[question.id] || [],
            textAnswer: null
          };
        }
      });

      const currentAttempt = attempt || test.myAttempt;
      const response = await axios.post(`${API_URL}/tests/${id}/submit`, {
        attemptId: currentAttempt.id,
        answers: answerArray
      });

      setResult(response.data);
      setResultDialogOpen(true);
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось отправить тест');
      console.error('Submit test error:', error);
    } finally {
      setSubmitting(false);
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

  if (error && !test) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Назад
        </Button>
      </Box>
    );
  }

  if (!test) {
    return <Alert severity="error">Тест не найден</Alert>;
  }

  if (!test.isActive) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Этот тест закрыт и больше недоступен для прохождения
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
          Назад
        </Button>
      </Box>
    );
  }

  const answeredCount = test.questions.filter(q => {
    if (q.type === 'text_input') {
      return textAnswers[q.id] && textAnswers[q.id].trim();
    }
    return answers[q.id] && answers[q.id].length > 0;
  }).length;

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
            <Chip
              label={`Вопросов: ${test.questions.length}`}
              size="small"
            />
            <Chip
              label={`Макс. балл: ${test.maxScore}`}
              size="small"
              color="primary"
            />
            {test.difficulty && (
              <Chip
                label={`Сложность: ${getDifficultyLabel(test.difficulty)}`}
                size="small"
                color={getDifficultyColor(test.difficulty)}
              />
            )}
            {test.timeLimit && (
              <Chip
                label={timeLeft ? `Осталось: ${timeLeft}` : `Время: ${test.timeLimit} мин`}
                size="small"
                color={timeLeft && parseInt(timeLeft.split(':')[0]) < 5 ? 'error' : 'default'}
              />
            )}
            <Chip
              label={`Отвечено: ${answeredCount}/${test.questions.length}`}
              size="small"
              color={answeredCount === test.questions.length ? 'success' : 'default'}
            />
          </Box>
        </CardContent>
      </Card>

      {test.questions.map((question, index) => (
        <Card key={question.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
              <Typography variant="h6">
                Вопрос {index + 1}: {question.question}
              </Typography>
              <Chip
                label={`${question.points} балл${question.points !== 1 ? 'ов' : ''}`}
                size="small"
                color="primary"
              />
            </Box>

            {question.type === 'multiple_choice' && (
              <FormControl component="fieldset">
                <RadioGroup
                  value={answers[question.id]?.[0] || ''}
                  onChange={(e) => handleAnswerChange(question.id, [e.target.value])}
                >
                  {question.answers.map((answer) => (
                    <FormControlLabel
                      key={answer.id}
                      value={answer.id}
                      control={<Radio />}
                      label={answer.text}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}

            {question.type === 'true_false' && (
              <FormControl component="fieldset">
                <RadioGroup
                  value={answers[question.id]?.[0] || ''}
                  onChange={(e) => handleAnswerChange(question.id, [e.target.value])}
                >
                  {question.answers.map((answer) => (
                    <FormControlLabel
                      key={answer.id}
                      value={answer.id}
                      control={<Radio />}
                      label={answer.text}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}

            {question.type === 'matching' && (
              <Box>
                {question.answers.map((answer) => (
                  <Box key={answer.id} sx={{ mb: 1 }}>
                    <FormControlLabel
                      control={
                        <Radio
                          checked={answers[question.id]?.includes(answer.id) || false}
                          onChange={(e) => {
                            const current = answers[question.id] || [];
                            if (e.target.checked) {
                              handleAnswerChange(question.id, [...current, answer.id]);
                            } else {
                              handleAnswerChange(question.id, current.filter(id => id !== answer.id));
                            }
                          }}
                        />
                      }
                      label={`${answer.text} → ${answer.matchKey || ''}`}
                    />
                  </Box>
                ))}
              </Box>
            )}

            {question.type === 'text_input' && (
              <TextField
                fullWidth
                label="Ваш ответ"
                value={textAnswers[question.id] || ''}
                onChange={(e) => handleTextAnswerChange(question.id, e.target.value)}
                multiline
                rows={3}
                placeholder="Введите ответ..."
              />
            )}
          </CardContent>
        </Card>
      ))}

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Отвечено: {answeredCount} из {test.questions.length} вопросов
        </Typography>
        <Button
          variant="contained"
          size="large"
          startIcon={<Send />}
          onClick={() => handleSubmit()}
          disabled={submitting || answeredCount === 0}
        >
          {submitting ? 'Отправка...' : 'Отправить тест'}
        </Button>
      </Box>

      {/* Result Dialog */}
      <Dialog open={resultDialogOpen} onClose={() => {
        setResultDialogOpen(false);
        navigate(-1);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Результаты теста</DialogTitle>
        <DialogContent>
          {result && (
            <Box>
              <Typography variant="h5" gutterBottom>
                {result.teacherScore !== null && result.teacherScore !== undefined 
                  ? `Ваш результат: ${result.teacherScore} / ${result.maxScore}`
                  : test?.autoGrade 
                    ? `Ваш результат: ${result.score} / ${result.maxScore}`
                    : 'Тест отправлен на проверку'}
              </Typography>
              {result.teacherScore !== null && result.teacherScore !== undefined && result.teacherScore !== result.score && test?.autoGrade && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Автоматическая оценка: {result.score} / {result.maxScore}
                </Typography>
              )}
              {!test?.autoGrade && result.teacherScore === null && result.teacherScore === undefined && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  Тест отправлен на ручную проверку преподавателем. Результаты будут доступны после проверки.
                </Alert>
              )}
              {(result.teacherScore !== null && result.teacherScore !== undefined) || (test?.autoGrade && result.score !== undefined) ? (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Процент выполнения: {Math.round(((result.teacherScore !== null && result.teacherScore !== undefined ? result.teacherScore : result.score) / result.maxScore) * 100)}%
                </Typography>
              ) : null}
              {result.teacherFeedback && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Комментарий преподавателя:
                  </Typography>
                  <Typography variant="body2">{result.teacherFeedback}</Typography>
                </Paper>
              )}
              {result.comments && result.comments.length > 0 && (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Комментарии ({result.comments.length})
                  </Typography>
                  {result.comments.map((comment) => (
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
              {result.answers && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Детали ответов:
                  </Typography>
                  {result.answers.map((answer) => (
                    <Paper key={answer.id} sx={{ p: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {test?.autoGrade && answer.isCorrect !== null ? (
                          answer.isCorrect ? (
                            <CheckCircle color="success" />
                          ) : (
                            <Cancel color="error" />
                          )
                        ) : answer.isCorrect === null ? (
                          <Chip label="Ожидает проверки" size="small" color="warning" />
                        ) : null}
                        {test?.autoGrade && answer.isCorrect !== null && (
                          <Typography variant="body2" fontWeight="bold">
                            {answer.isCorrect ? 'Правильно' : 'Неправильно'}
                          </Typography>
                        )}
                        {answer.points !== undefined && answer.points > 0 && (
                          <Chip
                            label={`${answer.points} балл${answer.points !== 1 ? 'ов' : ''}`}
                            size="small"
                            color={answer.isCorrect ? 'success' : 'default'}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {answer.question?.question || 'Вопрос'}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setResultDialogOpen(false);
            navigate(-1);
          }} variant="contained">
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeTest;

