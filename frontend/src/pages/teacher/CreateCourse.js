import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const CreateCourse = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPrivate: false,
    allowedEmails: '',
    difficulty: 'MEDIUM',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/courses`, formData);
      navigate(`/teacher/course/${response.data.id}`);
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать курс');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Создать новый курс
        </Typography>
        <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Название курса"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              margin="normal"
              autoFocus
            />
            <TextField
              fullWidth
              label="Описание курса"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              margin="normal"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                />
              }
              label="Персональный курс (доступен только указанным студентам)"
              sx={{ mt: 2 }}
            />
            {formData.isPrivate && (
              <TextField
                fullWidth
                label="Email студентов (через запятую)"
                name="allowedEmails"
                value={formData.allowedEmails}
                onChange={handleChange}
                margin="normal"
                helperText="Укажите email адреса студентов через запятую, например: student1@test.com, student2@test.com"
                placeholder="student1@test.com, student2@test.com"
              />
            )}
            <FormControl fullWidth margin="normal">
              <InputLabel>Сложность курса</InputLabel>
              <Select
                value={formData.difficulty}
                label="Сложность курса"
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <MenuItem value="LOW">Низкая</MenuItem>
                <MenuItem value="MEDIUM">Средняя</MenuItem>
                <MenuItem value="HIGH">Высокая</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading || !formData.title.trim()}
              >
                {loading ? <CircularProgress size={24} /> : 'Создать курс'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/teacher')}
              >
                Отмена
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreateCourse;

