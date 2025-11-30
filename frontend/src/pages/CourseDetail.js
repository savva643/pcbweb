import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  List,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore,
  VideoLibrary,
  Description,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import CourseChat from '../components/CourseChat';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  const fetchCourseData = useCallback(async () => {
    try {
      const [courseRes, materialsRes, assignmentsRes] = await Promise.all([
        axios.get(`${API_URL}/courses/${id}`),
        axios.get(`${API_URL}/materials/course/${id}`),
        axios.get(`${API_URL}/assignments/course/${id}`),
      ]);

      setCourse(courseRes.data);
      // Включаем связанные задания в материалы
      const materialsWithAssignments = materialsRes.data.map(material => ({
        ...material,
        assignment: material.assignmentId ? assignmentsRes.data.find(a => a.id === material.assignmentId) : null
      }));
      setMaterials(materialsWithAssignments);
      setAssignments(assignmentsRes.data);
    } catch (error) {
      setError('Не удалось загрузить данные курса');
      console.error('Fetch course error:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/progress/course/${id}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Fetch progress error:', error);
    }
  }, [id]);

  useEffect(() => {
    fetchCourseData();
    if (user?.role === 'STUDENT') {
      fetchProgress();
    }
  }, [fetchCourseData, fetchProgress, user?.role]);

  const markMaterialComplete = async (materialId) => {
    try {
      await axios.post(`${API_URL}/progress/material/${materialId}/complete`);
      fetchProgress();
    } catch (error) {
      console.error('Mark material complete error:', error);
    }
  };

  const isMaterialCompleted = (materialId) => {
    if (!progress) return false;
    return progress.progressRecords.some(
      (p) => p.materialId === materialId && p.completed
    );
  };

  const getSubmissionStatus = (assignment) => {
    if (!assignment.mySubmission) return 'not_submitted';
    if (assignment.mySubmission.status === 'GRADED') return 'graded';
    return 'submitted';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !course) {
    return <Alert severity="error">{error || 'Курс не найден'}</Alert>;
  }

  return (
    <Box className="page-enter">
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        {course.title}
      </Typography>
      {course.description && (
        <Typography variant="body1" color="text.secondary" paragraph>
          {course.description}
        </Typography>
      )}
      {user?.role === 'STUDENT' && progress && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Прогресс
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Материалы: {progress.materials.completed} / {progress.materials.total} (
                {Math.round(progress.materials.progress)}%)
              </Typography>
              <Typography variant="body2">
                Задания: {progress.assignments.completed} / {progress.assignments.total} (
                {Math.round(progress.assignments.progress)}%)
              </Typography>
              <Typography variant="body1" sx={{ mt: 1, fontWeight: 'bold' }}>
                Общий прогресс: {Math.round(progress.overallProgress)}%
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
        <Tab label="Материалы" />
        <Tab label="Задания" />
        <Tab label="Чат" />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          {materials.length === 0 ? (
            <Alert severity="info">Материалы пока не добавлены</Alert>
          ) : (
            <List>
              {materials.map((material, index) => (
                <Accordion key={material.id}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      {material.type === 'video' && <VideoLibrary />}
                      {material.type === 'text' && <Description />}
                      {material.type === 'file' && <Description />}
                      {material.type === 'scorm' && <VideoLibrary />}
                      {material.type === 'image' && <ImageIcon />}
                      <Typography variant="h6">{material.title}</Typography>
                      {material.assignment && (
                        <Chip
                          label="С заданием"
                          size="small"
                          color="primary"
                        />
                      )}
                      {user?.role === 'STUDENT' && (
                        <Chip
                          icon={
                            isMaterialCompleted(material.id) ? (
                              <CheckCircle />
                            ) : (
                              <RadioButtonUnchecked />
                            )
                          }
                          label={isMaterialCompleted(material.id) ? 'Пройдено' : 'Не пройдено'}
                          size="small"
                          color={isMaterialCompleted(material.id) ? 'success' : 'default'}
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {material.description && (
                      <Typography variant="body2" paragraph>
                        {material.description}
                      </Typography>
                    )}
                    {material.contentUrl && (
                      <Box sx={{ mt: 2 }}>
                        {material.type === 'video' ? (
                          <video controls width="100%" style={{ maxHeight: '600px', borderRadius: '8px' }}>
                            <source src={`${API_URL.replace('/api', '')}${material.contentUrl}`} />
                            Ваш браузер не поддерживает видео.
                          </video>
                        ) : material.type === 'image' ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <img 
                              src={`${API_URL.replace('/api', '')}${material.contentUrl}`} 
                              alt={material.title}
                              style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '8px' }}
                            />
                          </Box>
                        ) : material.type === 'scorm' ? (
                          <Box sx={{ border: '1px solid #ddd', borderRadius: '8px', p: 2, minHeight: '600px' }}>
                            <iframe
                              src={`${API_URL.replace('/api', '')}${material.contentUrl}`}
                              width="100%"
                              height="600px"
                              style={{ border: 'none', borderRadius: '8px' }}
                              title={material.title}
                            />
                          </Box>
                        ) : (
                          <Button
                            variant="outlined"
                            href={`${API_URL.replace('/api', '')}${material.contentUrl}`}
                            target="_blank"
                            download
                          >
                            Скачать файл
                          </Button>
                        )}
                      </Box>
                    )}
                    {material.assignment && (
                      <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          После изучения материала выполните задание:
                        </Typography>
                        <Button
                          variant="contained"
                          onClick={() => navigate(`/assignment/${material.assignment.id}`)}
                          sx={{ mt: 1 }}
                        >
                          {material.assignment.title}
                        </Button>
                      </Box>
                    )}
                    {user?.role === 'STUDENT' && !isMaterialCompleted(material.id) && (
                      <Button
                        variant="contained"
                        sx={{ mt: 2 }}
                        onClick={() => markMaterialComplete(material.id)}
                      >
                        Отметить как пройденное
                      </Button>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </List>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          {assignments.length === 0 ? (
            <Alert severity="info">Задания пока не добавлены</Alert>
          ) : (
            <List>
              {assignments.map((assignment) => {
                const status = getSubmissionStatus(assignment);
                return (
                  <Card key={assignment.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="h6">{assignment.title}</Typography>
                          {assignment.description && (
                            <Typography variant="body2" color="text.secondary" paragraph>
                              {assignment.description}
                            </Typography>
                          )}
                          {assignment.dueDate && (
                            <Typography variant="caption" color="text.secondary">
                              Срок сдачи: {new Date(assignment.dueDate).toLocaleDateString('ru-RU')}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          label={
                            status === 'graded'
                              ? 'Оценено'
                              : status === 'submitted'
                              ? 'Отправлено'
                              : 'Не отправлено'
                          }
                          color={
                            status === 'graded'
                              ? 'success'
                              : status === 'submitted'
                              ? 'info'
                              : 'default'
                          }
                        />
                      </Box>
                      {assignment.mySubmission?.grade && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            Оценка: {assignment.mySubmission.grade.score} / {assignment.mySubmission.grade.maxScore}
                          </Typography>
                          {assignment.mySubmission.grade.feedback && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {assignment.mySubmission.grade.feedback}
                            </Typography>
                          )}
                        </Box>
                      )}
                    </CardContent>
                    <Box sx={{ px: 2, pb: 2 }}>
                      <Button
                        variant="contained"
                        onClick={() => navigate(`/assignment/${assignment.id}`)}
                      >
                        {status === 'not_submitted' ? 'Отправить задание' : 'Просмотреть задание'}
                      </Button>
                    </Box>
                  </Card>
                );
              })}
            </List>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <CourseChat courseId={id} user={user} course={course} />
        </Box>
      )}
    </Box>
  );
};

export default CourseDetail;

