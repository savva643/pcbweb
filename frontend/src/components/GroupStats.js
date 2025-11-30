import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import {
  BarChart,
  Person,
} from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const GroupStats = ({ groupId }) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, [groupId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/groups/${groupId}/stats`);
      setStats(response.data);
    } catch (error) {
      setError('Не удалось загрузить статистику');
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!stats) {
    return <Alert severity="info">Статистика недоступна</Alert>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Статистика группы</Typography>
        <Button variant="outlined" onClick={fetchStats}>
          Обновить
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {stats.totalStudents}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Студентов
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {stats.totalHomeworks}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Домашних заданий
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography variant="h6" color="primary">
              {stats.groupAverageScore}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Средний балл группы
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Студент</TableCell>
              <TableCell align="center">Выполнено ДЗ</TableCell>
              <TableCell align="center">Средний балл</TableCell>
              <TableCell align="center">Общий балл</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.studentStats?.map((studentStat) => (
              <TableRow key={studentStat.student.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person />
                    <Box>
                      <Typography variant="body1">
                        {studentStat.student.firstName} {studentStat.student.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {studentStat.student.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${studentStat.completedCount}/${studentStat.totalCount}`}
                    color={studentStat.completedCount === studentStat.totalCount ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body1" fontWeight="bold">
                    {studentStat.averageScore}%
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2">
                    {studentStat.totalScore}/{studentStat.maxTotalScore}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/teacher/group/${groupId}/student/${studentStat.student.id}`)}
                  >
                    Подробнее
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default GroupStats;

