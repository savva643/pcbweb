import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseDetail from './pages/CourseDetail';
import AssignmentDetail from './pages/AssignmentDetail';
import MySubmissions from './pages/MySubmissions';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateCourse from './pages/teacher/CreateCourse';
import ManageCourse from './pages/teacher/ManageCourse';
import ReviewAssignment from './pages/teacher/ReviewAssignment';
import Profile from './pages/Profile';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/course/:id" element={<CourseDetail />} />
                  <Route path="/assignment/:id" element={<AssignmentDetail />} />
                  <Route path="/submissions" element={<MySubmissions />} />
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route path="/teacher/create-course" element={<CreateCourse />} />
                  <Route path="/teacher/course/:id" element={<ManageCourse />} />
                  <Route path="/teacher/assignment/:id" element={<ReviewAssignment />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;

