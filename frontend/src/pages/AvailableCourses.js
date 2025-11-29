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
import { Book, Assignment, People, School } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const AvailableCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
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

  const handleEnroll = async (courseId) => {
    setEnrolling({ ...enrolling, [courseId]: true });
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

  if (error && courses.length === 0) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box className="page-enter">
      <Typography variant="h4" gutterBottom>
        Доступные курсы
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {courses.length === 0 ? (
        <Alert severity="info">Нет доступных курсов</Alert>
      ) : (
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
                    <Chip
                      icon={<School />}
                      label={course.teacher.firstName + ' ' + course.teacher.lastName}
                      size="small"
                      color="primary"
                    />
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
                    <Chip
                      icon={<People />}
                      label={`${course._count?.enrollments || 0} студентов`}
                      size="small"
                    />
                  </Box>
                  {course.isEnrolled && (
                    <Chip
                      label="Вы записаны"
                      color="success"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
                <CardActions>
                  {course.isEnrolled ? (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      Открыть курс
                    </Button>
                  ) : (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling[course.id]}
                    >
                      {enrolling[course.id] ? 'Запись...' : 'Записаться на курс'}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AvailableCourses;

