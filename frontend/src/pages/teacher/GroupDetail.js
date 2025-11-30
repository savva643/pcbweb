import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add,
  Delete,
  PersonAdd,
  Book,
  Assignment,
  Chat,
  BarChart,
} from '@mui/icons-material';
import { useMediaQuery, useTheme } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import GroupChat from '../../components/GroupChat';
import GradesTable from '../../components/GradesTable';
import GroupStats from '../../components/GroupStats';
import GradesTableByRelated from '../../components/GradesTableByRelated';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [assignCourseDialogOpen, setAssignCourseDialogOpen] = useState(false);
  const [createHomeworkDialogOpen, setCreateHomeworkDialogOpen] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [homeworkForm, setHomeworkForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100
  });
  const [gradesView, setGradesView] = useState('monthly'); // 'monthly', 'course', 'homework', 'test'
  const [selectedRelatedId, setSelectedRelatedId] = useState(null);
  const [selectedRelatedType, setSelectedRelatedType] = useState(null);
  const [selectedRelatedTitle, setSelectedRelatedTitle] = useState('');

  useEffect(() => {
    fetchGroupDetails();
    if (tabValue === 3) {
      fetchAvailableCourses();
    }
  }, [id, tabValue]);

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

  const fetchAvailableCourses = async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setAvailableCourses(response.data.filter(c => c.teacherId === user?.id));
    } catch (error) {
      console.error('Fetch courses error:', error);
    }
  };

  const handleAddStudent = async () => {
    try {
      await axios.post(`${API_URL}/groups/${id}/students`, { studentEmail });
      setAddStudentDialogOpen(false);
      setStudentEmail('');
      fetchGroupDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось добавить студента');
    }
  };

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого студента из группы?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/groups/${id}/students/${studentId}`);
      fetchGroupDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось удалить студента');
    }
  };

  const handleAssignCourse = async () => {
    try {
      await axios.post(`${API_URL}/groups/${id}/courses`, { courseId: selectedCourseId });
      setAssignCourseDialogOpen(false);
      setSelectedCourseId('');
      fetchGroupDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось назначить курс');
    }
  };

  const handleUnassignCourse = async (courseId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот курс из группы?')) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/groups/${id}/courses/${courseId}`);
      fetchGroupDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось удалить курс');
    }
  };

  const handleCreateHomework = async () => {
    try {
      await axios.post(`${API_URL}/homeworks`, {
        groupId: id,
        ...homeworkForm,
        dueDate: homeworkForm.dueDate || null
      });
      setCreateHomeworkDialogOpen(false);
      setHomeworkForm({ title: '', description: '', dueDate: '', maxScore: 100 });
      fetchGroupDetails();
    } catch (error) {
      setError(error.response?.data?.error || 'Не удалось создать домашнее задание');
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
          onClick={() => navigate('/teacher/groups')}
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
        <Tab icon={<PersonAdd />} label="Студенты" iconPosition="start" />
        <Tab icon={<Book />} label="Курсы" iconPosition="start" />
        <Tab icon={<Assignment />} label="ДЗ" iconPosition="start" sx={{ display: { xs: 'none', md: 'flex' } }} />
        <Tab icon={<Assignment />} label="ДЗ" iconPosition="top" sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 'auto' }} />
        <Tab icon={<Chat />} label="Чат" iconPosition="start" />
        <Tab icon={<BarChart />} label="Успеваемость" iconPosition="start" sx={{ display: { xs: 'none', md: 'flex' } }} />
        <Tab icon={<BarChart />} label="Успев." iconPosition="top" sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 'auto' }} />
        <Tab icon={<BarChart />} label="Статистика" iconPosition="start" sx={{ display: { xs: 'none', md: 'flex' } }} />
        <Tab icon={<BarChart />} label="Стат." iconPosition="top" sx={{ display: { xs: 'flex', md: 'none' }, minWidth: 'auto' }} />
      </Tabs>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ 
            mb: 2, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            gap: { xs: 2, sm: 0 },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Студенты ({group.members?.length || 0})
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAddStudentDialogOpen(true)}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
            >
              Добавить студента
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Имя</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Дата добавления</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.members?.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      {member.student.firstName} {member.student.lastName}
                    </TableCell>
                    <TableCell>{member.student.email}</TableCell>
                    <TableCell>
                      {new Date(member.joinedAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveStudent(member.studentId)}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Курсы ({group.courseAssignments?.length || 0})</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setAssignCourseDialogOpen(true);
                fetchAvailableCourses();
              }}
            >
              Назначить курс
            </Button>
          </Box>
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
              <Card key={assignment.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box>
                      <Typography variant="h6">{assignment.course.title}</Typography>
                      {assignment.course.description && (
                        <Typography variant="body2" color="text.secondary">
                          {assignment.course.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleUnassignCourse(assignment.courseId)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">Домашние задания ({group.homeworks?.length || 0})</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateHomeworkDialogOpen(true)}
            >
              Создать ДЗ
            </Button>
          </Box>
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
              <Card key={homework.id}>
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
                      label={`Отправок: ${homework._count?.submissions || 0}`}
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

      {tabValue === 3 && (
        <Box>
          <GroupChat groupId={id} user={user} />
        </Box>
      )}

      {tabValue === 4 && (
        <Box>
          <Box sx={{ 
            mb: 2, 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2, 
            alignItems: { xs: 'stretch', sm: 'center' } 
          }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Успеваемость группы
            </Typography>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 200 } }}>
              <InputLabel>Вид успеваемости</InputLabel>
              <Select
                value={gradesView}
                label="Вид успеваемости"
                onChange={(e) => {
                  setGradesView(e.target.value);
                  setSelectedRelatedId(null);
                }}
              >
                <MenuItem value="monthly">По месяцам</MenuItem>
                <MenuItem value="course">По курсу</MenuItem>
                <MenuItem value="homework">По ДЗ</MenuItem>
                <MenuItem value="test">По тесту</MenuItem>
              </Select>
            </FormControl>
            {gradesView !== 'monthly' && (
              <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 300 } }}>
                <InputLabel>
                  {gradesView === 'course' ? 'Курс' : gradesView === 'homework' ? 'ДЗ' : 'Тест'}
                </InputLabel>
                <Select
                  value={selectedRelatedId || ''}
                  label={gradesView === 'course' ? 'Курс' : gradesView === 'homework' ? 'ДЗ' : 'Тест'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedRelatedId(value);
                    if (gradesView === 'course') {
                      const course = group.courseAssignments?.find(c => c.courseId === value);
                      setSelectedRelatedTitle(course?.course?.title || '');
                      setSelectedRelatedType('COURSE');
                    } else if (gradesView === 'homework') {
                      const homework = group.homeworks?.find(h => h.id === value);
                      setSelectedRelatedTitle(homework?.title || '');
                      setSelectedRelatedType('HOMEWORK');
                    }
                  }}
                >
                  {gradesView === 'course' && group.courseAssignments?.map((assignment) => (
                    <MenuItem key={assignment.courseId} value={assignment.courseId}>
                      {assignment.course.title}
                    </MenuItem>
                  ))}
                  {gradesView === 'homework' && group.homeworks?.map((homework) => (
                    <MenuItem key={homework.id} value={homework.id}>
                      {homework.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
          {gradesView === 'monthly' ? (
            <GradesTable groupId={id} isTeacher={true} />
          ) : selectedRelatedId ? (
            <GradesTableByRelated
              groupId={id}
              gradeType={selectedRelatedType}
              relatedId={selectedRelatedId}
              relatedTitle={selectedRelatedTitle}
            />
          ) : (
            <Alert severity="info">Выберите {gradesView === 'course' ? 'курс' : 'ДЗ'}</Alert>
          )}
        </Box>
      )}

      {tabValue === 5 && (
        <Box>
          <GroupStats groupId={id} />
        </Box>
      )}

      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onClose={() => setAddStudentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить студента</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Email студента"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            margin="normal"
            type="email"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddStudentDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleAddStudent}
            variant="contained"
            disabled={!studentEmail.trim()}
          >
            Добавить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Course Dialog */}
      <Dialog open={assignCourseDialogOpen} onClose={() => setAssignCourseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Назначить курс</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {availableCourses.map((course) => (
              <Card
                key={course.id}
                sx={{
                  mb: 1,
                  cursor: 'pointer',
                  bgcolor: selectedCourseId === course.id ? 'action.selected' : 'background.paper'
                }}
                onClick={() => setSelectedCourseId(course.id)}
              >
                <CardContent>
                  <Typography variant="h6">{course.title}</Typography>
                  {course.description && (
                    <Typography variant="body2" color="text.secondary">
                      {course.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignCourseDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleAssignCourse}
            variant="contained"
            disabled={!selectedCourseId}
          >
            Назначить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Homework Dialog */}
      <Dialog open={createHomeworkDialogOpen} onClose={() => setCreateHomeworkDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать домашнее задание</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Название"
            value={homeworkForm.title}
            onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Описание"
            value={homeworkForm.description}
            onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
            margin="normal"
            multiline
            rows={3}
          />
          <TextField
            fullWidth
            type="datetime-local"
            label="Срок сдачи"
            value={homeworkForm.dueDate}
            onChange={(e) => setHomeworkForm({ ...homeworkForm, dueDate: e.target.value })}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            fullWidth
            type="number"
            label="Максимальный балл"
            value={homeworkForm.maxScore}
            onChange={(e) => setHomeworkForm({ ...homeworkForm, maxScore: parseInt(e.target.value) || 100 })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateHomeworkDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleCreateHomework}
            variant="contained"
            disabled={!homeworkForm.title.trim()}
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupDetail;

