import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Button,
  LinearProgress,
} from '@mui/material';
import {
  Search,
  People,
  Assignment,
  TrendingUp,
  Star,
  ArrowBack,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CourseStats = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [id]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/teacher/courses/${id}/stats`);
      setStats(response.data);
    } catch (error) {
      setError('Не удалось загрузить статистику');
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await axios.get(`${API_URL}/teacher/courses/${id}/students`, {
        params: { search: searchQuery }
      });
      setSearchResults(response.data);
    } catch (error) {
      setError('Не удалось выполнить поиск');
    } finally {
      setSearching(false);
    }
  };

  const handleStudentClick = (studentId) => {
    navigate(`/teacher/course/${id}/student/${studentId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !stats) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box className="page-enter">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={() => navigate(`/teacher/course/${id}`)}>
          Назад
        </Button>
        <Typography variant="h4">
          Статистика курса: {stats?.course?.title || 'Загрузка...'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!stats && !loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Статистика пока недоступна
        </Alert>
      )}

      {/* Сводная статистика */}
      {stats && stats.summary && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.summary.totalStudents || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Студентов
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Assignment color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.summary.totalAssignments || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Заданий
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="success.main">
                  {stats.summary.gradedSubmissions || 0} / {stats.summary.totalSubmissions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Проверено работ
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" color="warning.main">
                  {stats.summary.averageGrade || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Средний балл
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Поиск студента */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Поиск студента
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? <CircularProgress size={24} /> : 'Найти'}
            </Button>
          </Box>
          {searchResults.length > 0 && (
            <Box sx={{ mt: 2 }}>
              {searchResults.map((student) => (
                <Card
                  key={student.id}
                  sx={{ mb: 1, cursor: 'pointer' }}
                  onClick={() => handleStudentClick(student.id)}
                >
                  <CardContent>
                    <Typography variant="body1">
                      {student.firstName} {student.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {student.email}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Список студентов */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Студенты курса ({stats?.students?.length || 0})
          </Typography>
          {!stats?.students || stats.students.length === 0 ? (
            <Alert severity="info">На курс еще никто не записался</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Студент</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Прогресс</TableCell>
                    <TableCell>Средний балл</TableCell>
                    <TableCell>Заданий выполнено</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.students?.map((student) => (
                    <TableRow key={student.studentId} hover>
                      <TableCell>
                        <Typography variant="body1">
                          {student.studentName}
                        </Typography>
                      </TableCell>
                      <TableCell>{student.studentEmail}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={student.progress}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Typography variant="body2" minWidth={40}>
                            {student.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${student.averageGrade}%`}
                          color={student.averageGrade >= 80 ? 'success' : student.averageGrade >= 60 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {student.gradedCount} / {student.submissionsCount}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleStudentClick(student.studentId)}
                        >
                          Подробнее
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CourseStats;


