import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const MySubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/submissions`);
      setSubmissions(response.data);
    } catch (error) {
      setError('Не удалось загрузить задания');
      console.error('Fetch submissions error:', error);
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

  if (submissions.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h5">У вас пока нет отправленных заданий</Typography>
      </Box>
    );
  }

  return (
    <Box className="page-enter">
      <Typography variant="h4" gutterBottom>
        Мои задания
      </Typography>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Курс</TableCell>
              <TableCell>Задание</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Оценка</TableCell>
              <TableCell>Дата отправки</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id}>
                <TableCell>{submission.assignment.course.title}</TableCell>
                <TableCell>{submission.assignment.title}</TableCell>
                <TableCell>
                  <Chip
                    label={
                      submission.status === 'GRADED'
                        ? 'Оценено'
                        : submission.status === 'SUBMITTED'
                        ? 'Отправлено'
                        : 'Ожидает проверки'
                    }
                    color={
                      submission.status === 'GRADED'
                        ? 'success'
                        : submission.status === 'SUBMITTED'
                        ? 'info'
                        : 'default'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {submission.grade ? (
                    <Typography variant="body2" fontWeight="bold">
                      {submission.grade.score} / {submission.grade.maxScore}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(submission.submittedAt).toLocaleDateString('ru-RU')}
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/assignment/${submission.assignmentId}`)}
                  >
                    Просмотреть
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

export default MySubmissions;

