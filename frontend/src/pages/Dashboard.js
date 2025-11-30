import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Book, Assignment, People } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Dashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      // Для студентов показываем доступные курсы для записи
      fetchAvailableCourses();
    } else {
      // Для преподавателей показываем их курсы
      fetchCourses();
    }
  }, [user?.role]);

  const fetchAvailableCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses/available`);
      setCourses(response.data);
    } catch (error) {
      setError('Не удалось загрузить курсы');
      console.error('Fetch courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setCourses(response.data);
    } catch (error) {
      setError('Не удалось загрузить курсы');
      console.error('Fetch courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    setEnrolling({ ...enrolling, [courseId]: true });
    setError('');
    try {
      await axios.post(`${API_URL}/courses/${courseId}/enroll`);
      // Обновляем список курсов
      const updatedCourses = courses.map(course =>
        course.id === courseId ? { ...course, isEnrolled: true } : course
      );
      setCourses(updatedCourses);
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось записаться на курс');
    } finally {
      setEnrolling({ ...enrolling, [courseId]: false });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (courses.length === 0 && !loading) {
    return (
      <Box textAlign="center" py={4} className="page-enter">
        <Typography variant="h5" gutterBottom>
          {user?.role === 'STUDENT'
            ? 'Нет доступных курсов'
            : 'У вас пока нет курсов'}
        </Typography>
        {user?.role === 'STUDENT' && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Курсы появятся здесь после их создания преподавателями
          </Typography>
        )}
        {user?.role === 'TEACHER' && (
          <Button
            variant="contained"
            sx={{ mt: 2 }}
            onClick={() => navigate('/teacher')}
          >
            Создать курс
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        {user?.role === 'STUDENT' ? 'Доступные курсы' : 'Мои курсы'}
      </Typography>
      {user?.role === 'STUDENT' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Выберите курс для записи или откройте уже записанный курс
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {courses.map((course, index) => (
          <Grid item xs={12} sm={6} md={4} key={course.id}>
            <Card 
              sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
              className="card-enter"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {course.description || 'Нет описания'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  {user?.role === 'STUDENT' && course.teacher && (
                    <Chip
                      icon={<People />}
                      label={`${course.teacher.firstName} ${course.teacher.lastName}`}
                      size="small"
                      color="primary"
                    />
                  )}
                  <Chip
                    icon={<Book />}
                    label={`${course._count?.materials || 0} материалов`}
                    size="small"
                  />
                  <Chip
                    icon={<Assignment />}
                    label={`${course._count?.assignments || 0} заданий`}
                    size="small"
                  />
                  {user?.role === 'TEACHER' && (
                    <Chip
                      icon={<People />}
                      label={`${course._count?.enrollments || 0} студентов`}
                      size="small"
                    />
                  )}
                  {user?.role === 'STUDENT' && course.isEnrolled && (
                    <Chip
                      label="Записан"
                      color="success"
                      size="small"
                    />
                  )}
                </Box>
              </CardContent>
              <CardActions>
                {user?.role === 'STUDENT' && course.isEnrolled ? (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    Открыть курс
                  </Button>
                ) : user?.role === 'STUDENT' ? (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrolling[course.id]}
                  >
                    {enrolling[course.id] ? 'Запись...' : 'Записаться на курс'}
                  </Button>
                ) : (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    Открыть
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;

