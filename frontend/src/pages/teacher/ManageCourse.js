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
import CourseChat from '../../components/CourseChat';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const ManageCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
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
  });
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100,
  });
  const [error, setError] = useState('');

  const fetchCourseData = useCallback(async () => {
    try {
      const [courseRes, materialsRes, assignmentsRes] = await Promise.all([
        axios.get(`${API_URL}/courses/${id}`),
        axios.get(`${API_URL}/materials/course/${id}`),
        axios.get(`${API_URL}/assignments/course/${id}`),
      ]);

      setCourse(courseRes.data);
      setMaterials(materialsRes.data);
      setAssignments(assignmentsRes.data);
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
      if (materialForm.file) {
        formData.append('file', materialForm.file);
      }

      await axios.post(`${API_URL}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMaterialDialogOpen(false);
      setMaterialForm({ title: '', description: '', type: 'text', order: 0, file: null });
      fetchCourseData();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать материал');
    }
  };

  const handleAssignmentSubmit = async () => {
    try {
      await axios.post(`${API_URL}/assignments`, {
        courseId: id,
        ...assignmentForm,
        dueDate: assignmentForm.dueDate || null,
      });

      setAssignmentDialogOpen(false);
      setAssignmentForm({ title: '', description: '', dueDate: '', maxScore: 100 });
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{course.title}</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={() => navigate(`/teacher/course/${id}/stats`)}
          >
            Статистика
          </Button>
          <Button variant="outlined" onClick={() => navigate('/teacher')}>
            ← Назад
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Материалы" />
        <Tab label="Задания" />
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
                          <Typography variant="h6">{material.title}</Typography>
                          <Chip label={material.type} size="small" />
                        </Box>
                        {material.description && (
                          <Typography variant="body2" color="text.secondary">
                            {material.description}
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
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
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
              <MenuItem value="video">Видео</MenuItem>
              <MenuItem value="file">Файл</MenuItem>
              <MenuItem value="scorm">SCORM</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            type="number"
            label="Порядок"
            value={materialForm.order}
            onChange={(e) => setMaterialForm({ ...materialForm, order: parseInt(e.target.value) || 0 })}
            margin="normal"
          />
          <input
            type="file"
            accept="*/*"
            onChange={(e) => setMaterialForm({ ...materialForm, file: e.target.files[0] })}
            style={{ marginTop: 16 }}
          />
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
          <TextField
            fullWidth
            type="datetime-local"
            label="Срок сдачи"
            value={assignmentForm.dueDate}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="number"
            label="Максимальный балл"
            value={assignmentForm.maxScore}
            onChange={(e) => setAssignmentForm({ ...assignmentForm, maxScore: parseInt(e.target.value) || 100 })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>Отмена</Button>
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

