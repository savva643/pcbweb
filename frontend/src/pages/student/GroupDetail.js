import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Book,
  Assignment,
  Chat,
  BarChart,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import GroupChat from '../../components/GroupChat';
import GradesTable from '../../components/GradesTable';
import { useMediaQuery, useTheme } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const StudentGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups/${id}`);
      setGroup(response.data);
    } catch (error) {
      setError('Не удалось загрузить данные группы');
      console.error('Fetch group error:', error);
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

  if (!group) {
    return <Alert severity="error">Группа не найдена</Alert>;
  }

  return (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            {group.name}
          </Typography>
          {group.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {group.description}
            </Typography>
          )}
        </Box>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/groups')}
          size={isMobile ? 'small' : 'medium'}
        >
          ← Назад
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Tabs 
        value={tabValue} 
        onChange={(e, newValue) => setTabValue(newValue)} 
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
      >
        <Tab icon={<Book />} label="Курсы" iconPosition="start" />
        <Tab icon={<Assignment />} label="ДЗ" iconPosition="start" sx={{ display: { xs: 'none', md: 'flex' } }} />
        <Tab icon={<Assignment />} label="ДЗ" iconPosition="top" sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 'auto' }} />
        <Tab icon={<Chat />} label="Чат" iconPosition="start" />
        <Tab icon={<BarChart />} label="Успеваемость" iconPosition="start" sx={{ display: { xs: 'none', md: 'flex' } }} />
        <Tab icon={<BarChart />} label="Успев." iconPosition="top" sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 'auto' }} />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Курсы ({group.courseAssignments?.length || 0})
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(auto-fill, minmax(250px, 1fr))',
              md: 'repeat(auto-fill, minmax(300px, 1fr))' 
            }, 
            gap: 2 
          }}>
            {group.courseAssignments?.map((assignment) => (
              <Card
                key={assignment.id}
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/course/${assignment.courseId}`)}
              >
                <CardContent>
                  <Typography variant="h6">{assignment.course.title}</Typography>
                  {assignment.course.description && (
                    <Typography variant="body2" color="text.secondary">
                      {assignment.course.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Домашние задания ({group.homeworks?.length || 0})
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(auto-fill, minmax(250px, 1fr))',
              md: 'repeat(auto-fill, minmax(300px, 1fr))' 
            }, 
            gap: 2 
          }}>
            {group.homeworks?.map((homework) => (
              <Card
                key={homework.id}
                sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/homework/${homework.id}`)}
              >
                <CardContent>
                  <Typography variant="h6">{homework.title}</Typography>
                  {homework.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {homework.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {homework.dueDate && (
                      <Chip
                        label={`Срок: ${new Date(homework.dueDate).toLocaleDateString('ru-RU')}`}
                        size="small"
                      />
                    )}
                    <Chip
                      label={`Макс. балл: ${homework.maxScore}`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <GroupChat groupId={id} user={user} />
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Моя успеваемость</Typography>
          <GradesTable groupId={id} studentId={user?.id} isTeacher={false} />
        </Box>
      )}
    </Box>
  );
};

export default StudentGroupDetail;

