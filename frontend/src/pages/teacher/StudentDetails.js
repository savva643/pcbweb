import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  Email,
  TrendingUp,
  Star,
  Assignment,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const StudentDetails = () => {
  const { courseId, studentId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [courseId, studentId]);

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/teacher/courses/${courseId}/students/${studentId}`
      );
      setData(response.data);
    } catch (error) {
      setError('Не удалось загрузить данные студента');
      console.error('Fetch student details error:', error);
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

  if (error || !data) {
    return <Alert severity="error">{error || 'Студент не найден'}</Alert>;
  }

  if (!data.progress) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/teacher/course/${courseId}/stats`)}
        >
          Назад
        </Button>
        <Typography variant="h4">
          {data.student.firstName} {data.student.lastName}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Информация о студенте */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Информация о студенте
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="action" />
                  <Typography variant="body1">
                    {data.student.firstName} {data.student.lastName}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email color="action" />
                  <Typography variant="body1">{data.student.email}</Typography>
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Статистика
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Прогресс по материалам
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={data.progress.materials.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" minWidth={50}>
                      {data.progress.materials.completed} / {data.progress.materials.total}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Прогресс по заданиям
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={data.progress.assignments.progress}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="body2" minWidth={50}>
                      {data.progress.assignments.completed} / {data.progress.assignments.total}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Общий прогресс
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: '100%' }}>
                      <LinearProgress
                        variant="determinate"
                        value={data.progress.overall}
                        color="success"
                        sx={{ height: 10, borderRadius: 4 }}
                      />
                    </Box>
                    <Typography variant="h6" minWidth={50}>
                      {data.progress.overall}%
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Star color="warning" />
                    <Typography variant="h6">Средний балл</Typography>
                  </Box>
                  <Typography variant="h4" color="warning.main">
                    {data.progress.averageGrade}%
                  </Typography>
                  {data.progress.totalMaxScore > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {data.progress.totalScore} / {data.progress.totalMaxScore} баллов
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Задания */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Задания курса
              </Typography>
              {data.assignments.length === 0 ? (
                <Alert severity="info">Заданий пока нет</Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Задание</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Оценка</TableCell>
                        <TableCell>Действия</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Typography variant="body1" fontWeight="bold">
                              {assignment.title}
                            </Typography>
                            {assignment.description && (
                              <Typography variant="body2" color="text.secondary">
                                {assignment.description.substring(0, 100)}
                                {assignment.description.length > 100 ? '...' : ''}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.submission ? (
                              <Chip
                                icon={
                                  assignment.submission.status === 'GRADED' ? (
                                    <CheckCircle />
                                  ) : (
                                    <RadioButtonUnchecked />
                                  )
                                }
                                label={
                                  assignment.submission.status === 'GRADED'
                                    ? 'Оценено'
                                    : assignment.submission.status === 'SUBMITTED'
                                    ? 'Отправлено'
                                    : 'Ожидает проверки'
                                }
                                color={
                                  assignment.submission.status === 'GRADED'
                                    ? 'success'
                                    : assignment.submission.status === 'SUBMITTED'
                                    ? 'info'
                                    : 'default'
                                }
                                size="small"
                              />
                            ) : (
                              <Chip label="Не отправлено" color="default" size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.submission?.grade ? (
                              <Typography variant="body1" fontWeight="bold">
                                {assignment.submission.grade.score} / {assignment.submission.grade.maxScore}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.submission && (
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                  navigate(`/teacher/assignment/${assignment.submission.assignmentId}`)
                                }
                              >
                                Проверить
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentDetails;


