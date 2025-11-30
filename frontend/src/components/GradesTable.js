import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import {
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Help,
} from '@mui/icons-material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const GradesTable = ({ groupId, studentId, isTeacher, onUpdate }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [editForm, setEditForm] = useState({
    score: '',
    maxScore: '',
    status: 'PRESENT',
    feedback: ''
  });

  useEffect(() => {
    fetchGrades();
  }, [groupId, studentId, year, month]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const url = studentId
        ? `${API_URL}/groups/${groupId}/students/${studentId}/grades?year=${year}&month=${month}`
        : `${API_URL}/groups/${groupId}/grades?year=${year}&month=${month}`;
      const response = await axios.get(url);
      setGrades(response.data);
    } catch (error) {
      console.error('Fetch grades error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (grade) => {
    setSelectedGrade(grade);
    setEditForm({
      score: grade.score || '',
      maxScore: grade.maxScore,
      status: grade.status,
      feedback: grade.feedback || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    try {
      await axios.post(`${API_URL}/groups/${groupId}/grades`, {
        studentId: selectedGrade.studentId,
        gradeDate: selectedGrade.gradeDate,
        gradeType: selectedGrade.gradeType,
        relatedId: selectedGrade.relatedId,
        score: editForm.score ? parseInt(editForm.score) : null,
        maxScore: parseInt(editForm.maxScore),
        status: editForm.status,
        feedback: editForm.feedback
      });
      setEditDialogOpen(false);
      fetchGrades();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Save grade error:', error);
    }
  };

  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту оценку?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/groups/${groupId}/grades/${gradeId}`);
      fetchGrades();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Delete grade error:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT':
        return <CheckCircle color="success" />;
      case 'EXCUSED_ABSENCE':
        return <Help color="warning" />;
      case 'UNEXCUSED_ABSENCE':
        return <Cancel color="error" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PRESENT':
        return 'Присутствовал';
      case 'EXCUSED_ABSENCE':
        return 'Уважительная причина';
      case 'UNEXCUSED_ABSENCE':
        return 'Неуважительная причина';
      default:
        return '';
    }
  };

  const getGradeTypeLabel = (type) => {
    switch (type) {
      case 'COURSE':
        return 'Курс';
      case 'HOMEWORK':
        return 'ДЗ';
      case 'TEST':
        return 'Тест';
      default:
        return type;
    }
  };

  // Группируем по датам
  const groupedByDate = {};
  grades.forEach(grade => {
    const dateKey = new Date(grade.gradeDate).toLocaleDateString('ru-RU');
    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(grade);
  });

  const dates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(a.split('.').reverse().join('-')) - new Date(b.split('.').reverse().join('-'));
  });

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Год</InputLabel>
          <Select
            value={year}
            label="Год"
            onChange={(e) => setYear(e.target.value)}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
              <MenuItem key={y} value={y}>{y}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Месяц</InputLabel>
          <Select
            value={month}
            label="Месяц"
            onChange={(e) => setMonth(e.target.value)}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <MenuItem key={m} value={m}>
                {new Date(2000, m - 1).toLocaleString('ru-RU', { month: 'long' })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              {!studentId && <TableCell>Студент</TableCell>}
              <TableCell>Тип</TableCell>
              <TableCell>Оценка</TableCell>
              <TableCell>Статус</TableCell>
              {isTeacher && <TableCell align="right">Действия</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {dates.map(date => (
              groupedByDate[date].map((grade, index) => (
                <TableRow key={grade.id}>
                  {index === 0 && (
                    <TableCell rowSpan={groupedByDate[date].length}>
                      {date}
                    </TableCell>
                  )}
                  {!studentId && (
                    <TableCell>
                      {grade.student?.firstName} {grade.student?.lastName}
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip label={getGradeTypeLabel(grade.gradeType)} size="small" />
                  </TableCell>
                  <TableCell>
                    {grade.score !== null ? `${grade.score}/${grade.maxScore}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(grade.status)}
                      <Typography variant="body2">{getStatusLabel(grade.status)}</Typography>
                    </Box>
                  </TableCell>
                  {isTeacher && (
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleEditClick(grade)}>
                        <Edit />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteGrade(grade.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ))}
            {dates.length === 0 && (
              <TableRow>
                <TableCell colSpan={isTeacher ? 6 : 5} align="center">
                  Нет оценок за выбранный период
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать оценку</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Оценка"
            type="number"
            value={editForm.score}
            onChange={(e) => setEditForm({ ...editForm, score: e.target.value })}
            margin="normal"
            helperText="Оставьте пустым, чтобы удалить оценку"
          />
          <TextField
            fullWidth
            label="Максимальный балл"
            type="number"
            value={editForm.maxScore}
            onChange={(e) => setEditForm({ ...editForm, maxScore: e.target.value })}
            margin="normal"
            required
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Статус</InputLabel>
            <Select
              value={editForm.status}
              label="Статус"
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            >
              <MenuItem value="PRESENT">Присутствовал</MenuItem>
              <MenuItem value="EXCUSED_ABSENCE">Уважительная причина</MenuItem>
              <MenuItem value="UNEXCUSED_ABSENCE">Неуважительная причина</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Комментарий"
            value={editForm.feedback}
            onChange={(e) => setEditForm({ ...editForm, feedback: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveGrade} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GradesTable;

