import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  Button,
  Grid,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { Person, Email, School, Logout, Book, Assignment, Star, TrendingUp } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/stats/student`);
      setStats(response.data);
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Box className="page-enter" sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Профиль
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }} className="profile-card">
        {/* Основная информация */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }} className="card-enter">
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 120, height: 120, fontSize: '3rem' }}>
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </Avatar>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom>
                    {user.firstName} {user.lastName}
                  </Typography>
                  <Chip
                    label={user.role === 'STUDENT' ? 'Студент' : 'Преподаватель'}
                    color={user.role === 'STUDENT' ? 'primary' : 'secondary'}
                    icon={user.role === 'STUDENT' ? <School /> : <Person />}
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Divider sx={{ width: '100%' }} />
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Email color="action" />
                    <Typography variant="body2">{user.email}</Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Logout />}
                  onClick={logout}
                  fullWidth
                  size="large"
                >
                  Выйти из аккаунта
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Статистика для студентов */}
        {user.role === 'STUDENT' && (
          <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }} className="card-enter profile-card">
              <CardContent>
                <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                  Статистика
                </Typography>
                {loading ? (
                  <CircularProgress />
                ) : stats ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Book color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" color="primary">
                          {stats.totalCourses}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Всего курсов
                        </Typography>
                        <Typography variant="caption" color="success.main">
                          Завершено: {stats.completedCourses}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Assignment color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" color="primary">
                          {stats.completedAssignments} / {stats.totalAssignments}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Выполнено заданий
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" color="warning.main">
                          {stats.averageGrade}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Средний балл
                        </Typography>
                        {stats.totalMaxScore > 0 && (
                          <Typography variant="caption" color="text.secondary">
                            {stats.totalScore} / {stats.totalMaxScore} баллов
                          </Typography>
                        )}
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                        <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography variant="h4" color="success.main">
                          {stats.courseProgress.length > 0
                            ? Math.round(
                                stats.courseProgress.reduce((sum, cp) => sum + cp.progress, 0) /
                                  stats.courseProgress.length
                              )
                            : 0}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Общий прогресс
                        </Typography>
                      </Card>
                    </Grid>
                    {stats.courseProgress.length > 0 && (
                      <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom>
                          Прогресс по курсам
                        </Typography>
                        {stats.courseProgress.map((cp) => (
                          <Box key={cp.courseId} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">{cp.courseTitle}</Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {Math.round(cp.progress)}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={cp.progress}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        ))}
                      </Grid>
                    )}
                  </Grid>
                ) : (
                  <Typography color="text.secondary">Нет данных</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Profile;

