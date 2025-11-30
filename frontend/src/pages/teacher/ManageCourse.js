import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  List,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add,
  VideoLibrary,
  Description,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useMediaQuery, useTheme } from '@mui/material';
import CourseChat from '../../components/CourseChat';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ManageCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'text',
    order: 0,
    file: null,
    assignmentId: '',
    content: ''
  });
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
    difficulty: 'MEDIUM',
  });
  const [error, setError] = useState('');

  const fetchCourseData = useCallback(async () => {
    try {
      const [courseRes, materialsRes, assignmentsRes, testsRes] = await Promise.all([
        axios.get(`${API_URL}/courses/${id}`),
        axios.get(`${API_URL}/materials/course/${id}`),
        axios.get(`${API_URL}/assignments/course/${id}`),
        axios.get(`${API_URL}/tests/course/${id}`),
      ]);

      setCourse(courseRes.data);
      setMaterials(materialsRes.data);
      setAssignments(assignmentsRes.data);
      setTests(testsRes.data);
    } catch (error) {
      setError('Не удалось загрузить данные курса');
      console.error('Fetch course error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleMaterialSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('courseId', id);
      formData.append('title', materialForm.title);
      formData.append('description', materialForm.description || '');
      formData.append('type', materialForm.type);
      formData.append('order', materialForm.order);
      if (materialForm.assignmentId) {
        formData.append('assignmentId', materialForm.assignmentId);
      }
      if (materialForm.content && (materialForm.type === 'text' || materialForm.type === 'markdown' || materialForm.type === 'wiki')) {
        formData.append('content', materialForm.content);
      }
      if (materialForm.file) {
        formData.append('file', materialForm.file);
      }

      await axios.post(`${API_URL}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMaterialDialogOpen(false);
      setMaterialForm({ title: '', description: '', type: 'text', order: 0, file: null, assignmentId: '', content: '' });
      fetchCourseData();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать материал');
    }
  };

  const handleAssignmentSubmit = async () => {
    try {
      await axios.post(`${API_URL}/assignments`, {
        courseId: id,
        title: assignmentForm.title,
        description: assignmentForm.description,
        dueDate: assignmentForm.dueDate || null,
        maxScore: assignmentForm.maxScore,
        difficulty: assignmentForm.difficulty,
      });

      setAssignmentDialogOpen(false);
      setAssignmentForm({ title: '', description: '', dueDate: '', maxScore: 100, difficulty: 'MEDIUM' });
      fetchCourseData();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать задание');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return <Alert severity="error">Курс не найден</Alert>;
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          {course.title}
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 2 },
          width: { xs: '100%', sm: 'auto' }
        }}>
          <Button
            variant="contained"
            onClick={() => navigate(`/teacher/course/${id}/stats`)}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
          >
            Статистика
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/teacher')}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
          >
            ← Назад
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)} 
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab label="Материалы" />
        <Tab label="Задания" />
        <Tab label="Тесты" />
        <Tab label="Чат" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Учебные материалы</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setMaterialDialogOpen(true)}
            >
              Добавить материал
            </Button>
          </Box>

          {materials.length === 0 ? (
            <Alert severity="info">Материалы пока не добавлены</Alert>
          ) : (
            <List>
              {materials.map((material) => (
                <Card key={material.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {material.type === 'video' && <VideoLibrary />}
                          {material.type === 'text' && <Description />}
                          {material.type === 'file' && <Description />}
                          {material.type === 'scorm' && <VideoLibrary />}
                          {(material.type === 'markdown' || material.type === 'wiki') && <Description />}
                          <Typography variant="h6">{material.title}</Typography>
                          <Chip label={material.type} size="small" />
                        </Box>
                        {material.description && (
                          <Typography variant="body2" color="text.secondary">
                            {material.description}
                          </Typography>
                        )}
                        {material.content && (material.type === 'text' || material.type === 'markdown' || material.type === 'wiki') && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Текстовый материал ({material.content.length} символов)
                          </Typography>
                        )}
                        {material.contentUrl && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            Файл: {material.contentUrl.split('/').pop()}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Задания</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAssignmentDialogOpen(true)}
            >
              Добавить задание
            </Button>
          </Box>

          {assignments.length === 0 ? (
            <Alert severity="info">Задания пока не добавлены</Alert>
          ) : (
            <List>
              {assignments.map((assignment) => (
                <Card key={assignment.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{assignment.title}</Typography>
                        {assignment.description && (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {assignment.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          {assignment.dueDate && (
                            <Chip
                              label={`Срок: ${new Date(assignment.dueDate).toLocaleDateString('ru-RU')}`}
                              size="small"
                            />
                          )}
                          <Chip
                            label={`Отправок: ${assignment._count?.submissions || 0}`}
                            size="small"
                            color="primary"
                          />
                          {assignment.difficulty && (
                            <Chip
                              label={`Сложность: ${assignment.difficulty === 'LOW' ? 'Низкая' : assignment.difficulty === 'MEDIUM' ? 'Средняя' : 'Высокая'}`}
                              size="small"
                              color={assignment.difficulty === 'LOW' ? 'success' : assignment.difficulty === 'MEDIUM' ? 'warning' : 'error'}
                            />
                          )}
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/teacher/assignment/${assignment.id}`)}
                      >
                        Проверить
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Тесты ({tests.length})</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate(`/teacher/course/${id}/create-test`)}
            >
              Создать тест
            </Button>
          </Box>
          {tests.length === 0 ? (
            <Alert severity="info">Тесты пока не добавлены</Alert>
          ) : (
            <List>
              {tests.map((test) => (
                <Card key={test.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6">{test.title}</Typography>
                        {test.description && (
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {test.description}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={`Вопросов: ${test._count?.questions || 0}`}
                            size="small"
                          />
                          <Chip
                            label={`Макс. балл: ${test.maxScore}`}
                            size="small"
                            color="primary"
                          />
                          {test.timeLimit && (
                            <Chip
                              label={`Время: ${test.timeLimit} мин`}
                              size="small"
                            />
                          )}
                          {test.difficulty && (
                            <Chip
                              label={`Сложность: ${test.difficulty === 'LOW' ? 'Низкая' : test.difficulty === 'MEDIUM' ? 'Средняя' : 'Высокая'}`}
                              size="small"
                              color={test.difficulty === 'LOW' ? 'success' : test.difficulty === 'MEDIUM' ? 'warning' : 'error'}
                            />
                          )}
                          <Chip
                            label={test.isActive ? 'Активен' : 'Закрыт'}
                            size="small"
                            color={test.isActive ? 'success' : 'default'}
                          />
                          <Chip
                            label={test.autoGrade ? 'Автопроверка' : 'Ручная проверка'}
                            size="small"
                            color={test.autoGrade ? 'info' : 'warning'}
                          />
                        </Box>
                      </Box>
                      <Button
                        variant="outlined"
                        onClick={() => navigate(`/teacher/test/${test.id}`)}
                        sx={{ ml: 2 }}
                      >
                        Просмотр попыток
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </List>
          )}
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <CourseChat courseId={id} user={user} course={course} />
        </Box>
      )}

      {/* Material Dialog */}
      <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить материал</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={materialForm.title}
            onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={materialForm.description}
            onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Тип</InputLabel>
            <Select
              value={materialForm.type}
              onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}
              label="Тип"
            >
              <MenuItem value="text">Текст</MenuItem>
              <MenuItem value="markdown">Markdown</MenuItem>
              <MenuItem value="wiki">Wiki</MenuItem>
              <MenuItem value="video">Видео</MenuItem>
              <MenuItem value="image">Изображение</MenuItem>
              <MenuItem value="file">Файл</MenuItem>
              <MenuItem value="scorm">SCORM</MenuItem>
            </Select>
          </FormControl>
          {(materialForm.type === 'text' || materialForm.type === 'markdown' || materialForm.type === 'wiki') && (
            <TextField
              fullWidth
              label="Содержимое"
              value={materialForm.content}
              onChange={(e) => setMaterialForm({ ...materialForm, content: e.target.value })}
              margin="normal"
              multiline
              rows={10}
              placeholder={materialForm.type === 'markdown' ? 'Введите Markdown текст...' : 'Введите текст...'}
            />
          )}
          <TextField
            fullWidth
            type="number"
            label="Порядок"
            value={materialForm.order}
            onChange={(e) => setMaterialForm({ ...materialForm, order: parseInt(e.target.value) || 0 })}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Связать с заданием (опционально)</InputLabel>
            <Select
              value={materialForm.assignmentId}
              onChange={(e) => setMaterialForm({ ...materialForm, assignmentId: e.target.value })}
              label="Связать с заданием (опционально)"
            >
              <MenuItem value="">Нет</MenuItem>
              {assignments.map((assignment) => (
                <MenuItem key={assignment.id} value={assignment.id}>
                  {assignment.title}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {materialForm.type !== 'text' && materialForm.type !== 'markdown' && materialForm.type !== 'wiki' && (
            <input
              type="file"
              accept={materialForm.type === 'image' ? 'image/*' : materialForm.type === 'video' ? 'video/*' : '*/*'}
              onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files[0] })}
              style={{ marginTop: 16 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleMaterialSubmit}
            variant="contained"
            disabled={!materialForm.title.trim()}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить задание</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={assignmentForm.title}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={assignmentForm.description}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              type="datetime-local"
              label="Срок сдачи"
              value={assignmentForm.dueDate}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              sx={{ flex: 1 }}
            />
            <TextField
              type="number"
              label="Максимальный балл"
              value={assignmentForm.maxScore}
              onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: parseInt(e.target.value) || 100 })}
              margin="normal"
              sx={{ width: 200 }}
            />
            <FormControl margin="normal" sx={{ width: 200 }}>
              <InputLabel>Сложность</InputLabel>
              <Select
                value={assignmentForm.difficulty}
                label="Сложность"
                onChange={(e) => setAssignmentForm({ ...assignmentForm, difficulty: e.target.value })}
              >
                <MenuItem value="LOW">Низкая</MenuItem>
                <MenuItem value="MEDIUM">Средняя</MenuItem>
                <MenuItem value="HIGH">Высокая</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setAssignmentDialogOpen(false);
            setAssignmentForm({ title: '', description: '', dueDate: '', maxScore: 100, difficulty: 'MEDIUM' });
          }}>Отмена</Button>
          <Button
            onClick={handleAssignmentSubmit}
            variant="contained"
            disabled={!assignmentForm.title.trim()}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageCourse;

