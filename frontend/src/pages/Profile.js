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
import { Person, Email, School, Logout } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  return (
    <Box className="page-enter" sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Профиль
      </Typography>
      <Card sx={{ mt: 3, p: 4 }} className="card-enter">
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
          <Divider sx={{ my: 3 }} />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Logout />}
              onClick={logout}
              size="large"
            >
              Выйти из аккаунта
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;

