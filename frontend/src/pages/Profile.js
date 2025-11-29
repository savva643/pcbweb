import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
} from '@mui/material';
import { Person, Email, School, CalendarToday } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Box className="page-enter">
      <Typography variant="h4" gutterBottom>
        Профиль
      </Typography>
      <Card sx={{ maxWidth: 600, mt: 3 }} className="card-enter">
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
              {user.firstName?.[0]}{user.lastName?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h5" gutterBottom>
                {user.firstName} {user.lastName}
              </Typography>
              <Chip
                label={user.role === 'STUDENT' ? 'Студент' : 'Преподаватель'}
                color={user.role === 'STUDENT' ? 'primary' : 'secondary'}
                icon={user.role === 'STUDENT' ? <School /> : <Person />}
              />
            </Box>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Email color="action" />
              <Typography variant="body1">
                <strong>Email:</strong> {user.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Person color="action" />
              <Typography variant="body1">
                <strong>Роль:</strong> {user.role === 'STUDENT' ? 'Студент' : 'Преподаватель'}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;

