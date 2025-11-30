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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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

const GradesTableByRelated = ({ groupId, gradeType, relatedId, relatedTitle, onUpdate }) => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, [groupId, gradeType, relatedId]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/groups/${groupId}/grades/${gradeType}/${relatedId}`);
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

  if (loading) {
    return <Box>Загрузка...</Box>;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Успеваемость: {relatedTitle}
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Студент</TableCell>
              <TableCell>Оценка</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grades.map((grade) => (
              <TableRow key={grade.id}>
                <TableCell>
                  {grade.student?.firstName} {grade.student?.lastName}
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
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEditClick(grade)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteGrade(grade.id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {grades.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Нет оценок
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

export default GradesTableByRelated;

