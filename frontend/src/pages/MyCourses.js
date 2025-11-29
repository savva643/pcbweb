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
import { Book, Assignment } from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (courses.length === 0) {
    return (
      <Box textAlign="center" py={4} className="page-enter">
        <Typography variant="h5" gutterBottom>
          Вы еще не записаны на курсы
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate('/')}
        >
          Выбрать курсы
        </Button>
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <Typography variant="h4" gutterBottom>
        Мои курсы
      </Typography>
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
                    icon={<Book />}
                    label={`${course._count?.materials || 0} материалов`}
                    size="small"
                  />
                  <Chip
                    icon={<Assignment />}
                    label={`${course._count?.assignments || 0} заданий`}
                    size="small"
                  />
                </Box>
                {course.teacher && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Преподаватель: {course.teacher.firstName} {course.teacher.lastName}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(`/course/${course.id}`)}
                >
                  Открыть
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default MyCourses;

