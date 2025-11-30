import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ArrowUpward,
  ArrowDownward,
  Save,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CreateTest = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [test, setTest] = useState({
    title: '',
    description: '',
    maxScore: 100,
    timeLimit: null,
    autoGrade: true,
    difficulty: 'MEDIUM',
  });
  const [questions, setQuestions] = useState([]);
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    type: 'multiple_choice',
    question: '',
    points: 1,
    answers: [],
  });
  const [currentAnswer, setCurrentAnswer] = useState({
    text: '',
    isCorrect: false,
    matchKey: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setError('ID курса не указан');
    }
  }, [courseId]);

  const handleAddAnswer = () => {
    if (!currentAnswer.text.trim()) return;

    const newAnswer = {
      id: Date.now().toString(),
      text: currentAnswer.text,
      isCorrect: currentAnswer.isCorrect,
      matchKey: questionForm.type === 'matching' ? currentAnswer.matchKey : null,
      order: questionForm.answers.length,
    };

    setQuestionForm({
      ...questionForm,
      answers: [...questionForm.answers, newAnswer],
    });

    setCurrentAnswer({ text: '', isCorrect: false, matchKey: '' });
  };

  const handleRemoveAnswer = (answerId) => {
    setQuestionForm({
      ...questionForm,
      answers: questionForm.answers.filter(a => a.id !== answerId),
    });
  };

  const handleSaveQuestion = () => {
    if (!questionForm.question.trim()) {
      setError('Введите текст вопроса');
      return;
    }

    if (questionForm.answers.length === 0) {
      setError('Добавьте хотя бы один ответ');
      return;
    }

    if (questionForm.type === 'multiple_choice' || questionForm.type === 'true_false') {
      const hasCorrect = questionForm.answers.some(a => a.isCorrect);
      if (!hasCorrect) {
        setError('Выберите хотя бы один правильный ответ');
        return;
      }
    }

    if (questionForm.type === 'matching') {
      const allHaveMatchKey = questionForm.answers.every(a => a.matchKey);
      if (!allHaveMatchKey) {
        setError('Все ответы должны иметь ключ сопоставления');
        return;
      }
    }

    const question = {
      ...questionForm,
      id: editingQuestion ? editingQuestion.id : Date.now().toString(),
      order: editingQuestion ? editingQuestion.order : questions.length,
    };

    if (editingQuestion) {
      setQuestions(questions.map(q => q.id === editingQuestion.id ? question : q));
    } else {
      setQuestions([...questions, question]);
    }

    setQuestionDialogOpen(false);
    setEditingQuestion(null);
    setQuestionForm({
      type: 'multiple_choice',
      question: '',
      points: 1,
      answers: [],
    });
    setCurrentAnswer({ text: '', isCorrect: false, matchKey: '' });
    setError('');
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      type: question.type,
      question: question.question,
      points: question.points,
      answers: question.answers.map(a => ({ ...a })),
    });
    setQuestionDialogOpen(true);
  };

  const handleDeleteQuestion = (questionId) => {
    setQuestions(questions.filter(q => q.id !== questionId));
  };

  const handleMoveQuestion = (questionId, direction) => {
    const index = questions.findIndex(q => q.id === questionId);
    if (direction === 'up' && index > 0) {
      const newQuestions = [...questions];
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
      newQuestions[index - 1].order = index - 1;
      newQuestions[index].order = index;
      setQuestions(newQuestions);
    } else if (direction === 'down' && index < questions.length - 1) {
      const newQuestions = [...questions];
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
      newQuestions[index].order = index;
      newQuestions[index + 1].order = index + 1;
      setQuestions(newQuestions);
    }
  };

  const handleSaveTest = async () => {
    if (!test.title.trim()) {
      setError('Введите название теста');
      return;
    }

    if (questions.length === 0) {
      setError('Добавьте хотя бы один вопрос');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Создаем тест
      const testResponse = await axios.post(`${API_URL}/tests`, {
        courseId,
        title: test.title,
        description: test.description,
        maxScore: test.maxScore,
        timeLimit: test.timeLimit || null,
        autoGrade: test.autoGrade,
        difficulty: test.difficulty,
      });

      const testId = testResponse.data.id;

      // Добавляем вопросы
      for (const question of questions) {
        await axios.post(`${API_URL}/tests/${testId}/questions`, {
          type: question.type,
          question: question.question,
          points: question.points,
          answers: question.answers.map(a => ({
            text: a.text,
            isCorrect: a.isCorrect,
            order: a.order,
            matchKey: a.matchKey || null,
          })),
        });
      }

      navigate(`/teacher/course/${courseId}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось сохранить тест');
      console.error('Save test error:', error);
    } finally {
      setSaving(false);
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case 'multiple_choice':
        return 'Выбор ответа';
      case 'true_false':
        return 'Верно/Неверно';
      case 'matching':
        return 'Сопоставление';
      case 'text_input':
        return 'Вписывание';
      default:
        return type;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Создать тест
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Название теста"
            value={test.title}
            onChange={(e) => setTest({ ...test, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={test.description}
            onChange={(e) => setTest({ ...test, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              type="number"
              label="Максимальный балл"
              value={test.maxScore}
              onChange={(e) => setTest({ ...test, maxScore: parseInt(e.target.value) || 100 })}
              margin="normal"
            />
            <TextField
              type="number"
              label="Лимит времени (минуты)"
              value={test.timeLimit || ''}
              onChange={(e) => setTest({ ...test, timeLimit: e.target.value ? parseInt(e.target.value) : null })}
              margin="normal"
              helperText="Оставьте пустым для неограниченного времени"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={test.autoGrade}
                  onChange={(e) => setTest({ ...test, autoGrade: e.target.checked })}
                />
              }
              label="Автоматическая проверка"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {test.autoGrade 
                ? 'Тест будет автоматически проверяться по правильным ответам' 
                : 'Тест требует ручной проверки преподавателем'}
            </Typography>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Сложность</InputLabel>
              <Select
                value={test.difficulty}
                label="Сложность"
                onChange={(e) => setTest({ ...test, difficulty: e.target.value })}
              >
                <MenuItem value="LOW">Низкая</MenuItem>
                <MenuItem value="MEDIUM">Средняя</MenuItem>
                <MenuItem value="HIGH">Высокая</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Вопросы ({questions.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setQuestionDialogOpen(true);
            setEditingQuestion(null);
            setQuestionForm({
              type: 'multiple_choice',
              question: '',
              points: 1,
              answers: [],
            });
            setCurrentAnswer({ text: '', isCorrect: false, matchKey: '' });
          }}
        >
          Добавить вопрос
        </Button>
      </Box>

      <List>
        {questions.map((question, index) => (
          <Card key={question.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip label={getQuestionTypeLabel(question.type)} size="small" />
                    <Chip label={`${question.points} балл${question.points !== 1 ? 'ов' : ''}`} size="small" color="primary" />
                  </Box>
                  <Typography variant="h6">{question.question}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Ответов: {question.answers.length}
                  </Typography>
                </Box>
                <Box>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveQuestion(question.id, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUpward />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveQuestion(question.id, 'down')}
                    disabled={index === questions.length - 1}
                  >
                    <ArrowDownward />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleEditQuestion(question)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteQuestion(question.id)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>

      {questions.length === 0 && (
        <Alert severity="info">Добавьте вопросы к тесту</Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={() => navigate(`/teacher/course/${courseId}`)}
        >
          Отмена
        </Button>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSaveTest}
          disabled={saving || questions.length === 0}
        >
          Сохранить тест
        </Button>
      </Box>

      {/* Question Dialog */}
      <Dialog
        open={questionDialogOpen}
        onClose={() => {
          setQuestionDialogOpen(false);
          setEditingQuestion(null);
          setError('');
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип вопроса</InputLabel>
            <Select
              value={questionForm.type}
              onChange={(e) => {
                setQuestionForm({
                  ...questionForm,
                  type: e.target.value,
                  answers: [],
                });
                setCurrentAnswer({ text: '', isCorrect: false, matchKey: '' });
              }}
              label="Тип вопроса"
            >
              <MenuItem value="multiple_choice">Выбор ответа</MenuItem>
              <MenuItem value="true_false">Верно/Неверно</MenuItem>
              <MenuItem value="matching">Сопоставление</MenuItem>
              <MenuItem value="text_input">Вписывание</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Вопрос"
            value={questionForm.question}
            onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
            margin="normal"
            multiline
            rows={3}
            required
          />

          <TextField
            type="number"
            label="Баллы"
            value={questionForm.points}
            onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 1 })}
            margin="normal"
            sx={{ width: 150 }}
          />

          {questionForm.type !== 'text_input' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Ответы:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Текст ответа"
                  value={currentAnswer.text}
                  onChange={(e) => setCurrentAnswer({ ...currentAnswer, text: e.target.value })}
                  size="small"
                />
                {questionForm.type === 'matching' && (
                  <TextField
                    label="Ключ сопоставления"
                    value={currentAnswer.matchKey}
                    onChange={(e) => setCurrentAnswer({ ...currentAnswer, matchKey: e.target.value })}
                    size="small"
                    sx={{ width: 200 }}
                  />
                )}
                {(questionForm.type === 'multiple_choice' || questionForm.type === 'true_false') && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={currentAnswer.isCorrect}
                        onChange={(e) => setCurrentAnswer({ ...currentAnswer, isCorrect: e.target.checked })}
                      />
                    }
                    label="Правильный"
                  />
                )}
                <Button
                  variant="outlined"
                  onClick={handleAddAnswer}
                  disabled={!currentAnswer.text.trim()}
                >
                  Добавить
                </Button>
              </Box>

              <List>
                {questionForm.answers.map((answer, index) => (
                  <ListItem key={answer.id}>
                    <ListItemText
                      primary={answer.text}
                      secondary={
                        questionForm.type === 'matching'
                          ? `Ключ: ${answer.matchKey}`
                          : answer.isCorrect
                          ? 'Правильный ответ'
                          : 'Неправильный ответ'
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleRemoveAnswer(answer.id)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {questionForm.type === 'text_input' && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Для вопросов типа "Вписывание" добавьте правильный ответ(ы) ниже. Проверка будет происходить по точному совпадению (без учета регистра).
              </Alert>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Правильный ответ"
                  value={currentAnswer.text}
                  onChange={(e) => setCurrentAnswer({ ...currentAnswer, text: e.target.value, isCorrect: true })}
                  size="small"
                  helperText="Можно добавить несколько вариантов правильного ответа"
                />
                <Button
                  variant="outlined"
                  onClick={handleAddAnswer}
                  disabled={!currentAnswer.text.trim()}
                >
                  Добавить
                </Button>
              </Box>
              {questionForm.answers.length > 0 && (
                <List>
                  {questionForm.answers.map((answer) => (
                    <ListItem key={answer.id}>
                      <ListItemText
                        primary={answer.text}
                        secondary="Правильный ответ"
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleRemoveAnswer(answer.id)}
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setQuestionDialogOpen(false);
            setEditingQuestion(null);
            setError('');
          }}>
            Отмена
          </Button>
          <Button onClick={handleSaveQuestion} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateTest;

