import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
  People,
  Assignment,
  Book,
  Chat,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const Groups = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuGroupId, setMenuGroupId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(`${API_URL}/groups`);
      setGroups(response.data);
    } catch (error) {
      setError('Не удалось загрузить группы');
      console.error('Fetch groups error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await axios.post(`${API_URL}/groups`, formData);
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать группу');
    }
  };

  const handleEditGroup = async () => {
    try {
      await axios.put(`${API_URL}/groups/${selectedGroup.id}`, formData);
      setEditDialogOpen(false);
      setSelectedGroup(null);
      setFormData({ name: '', description: '' });
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось обновить группу');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту группу?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/groups/${groupId}`);
      fetchGroups();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось удалить группу');
    }
    setMenuAnchor(null);
  };

  const handleMenuOpen = (event, groupId) => {
    setMenuAnchor(event.currentTarget);
    setMenuGroupId(groupId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuGroupId(null);
  };

  const handleEditClick = (group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || ''
    });
    setEditDialogOpen(true);
    handleMenuClose();
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
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: { xs: 2, sm: 3 },
        gap: { xs: 2, sm: 0 }
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Группы
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
        >
          Создать группу
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {groups.length === 0 ? (
        <Alert severity="info">Группы пока не созданы</Alert>
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
            <Card key={group.id} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/teacher/group/${group.id}`)}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography variant="h6">{group.name}</Typography>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, group.id);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать группу</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать группу</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleEditGroup}
            variant="contained"
            disabled={!formData.name.trim()}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleEditClick(groups.find(g => g.id === menuGroupId))}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Редактировать</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleDeleteGroup(menuGroupId)}>
          <ListItemIcon>
            <Delete fontSize="small" />
          </ListItemIcon>
          <ListItemText>Удалить</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Groups;

