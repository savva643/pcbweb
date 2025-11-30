import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  People,
  Assignment,
  Book,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const StudentGroups = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups/student`);
      setGroups(response.data);
    } catch (error) {
      setError('Не удалось загрузить группы');
      console.error('Fetch groups error:', error);
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

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Мои группы
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {groups.length === 0 ? (
        <Alert severity="info">Вы не состоите ни в одной группе</Alert>
      ) : (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: 'repeat(auto-fill, minmax(250px, 1fr))',
            md: 'repeat(auto-fill, minmax(300px, 1fr))' 
          }, 
          gap: 2 
        }}>
          {groups.map((group) => (
            <Card
              key={group.id}
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(`/group/${group.id}`)}
            >
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1 }}>{group.name}</Typography>
                {group.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {group.description}
                  </Typography>
                )}
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    icon={<People />}
                    label={`${group._count?.members || 0} студентов`}
                    size="small"
                  />
                  <Chip
                    icon={<Assignment />}
                    label={`${group._count?.homeworks || 0} ДЗ`}
                    size="small"
                  />
                  <Chip
                    icon={<Book />}
                    label={`${group._count?.courseAssignments || 0} курсов`}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default StudentGroups;

