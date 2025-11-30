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
import MyCourses from './pages/MyCourses';
import TeacherDashboard from './pages/TeacherDashboard';
import CreateCourse from './pages/teacher/CreateCourse';
import ManageCourse from './pages/teacher/ManageCourse';
import ReviewAssignment from './pages/teacher/ReviewAssignment';
import CourseStats from './pages/teacher/CourseStats';
import StudentDetails from './pages/teacher/StudentDetails';
import Groups from './pages/teacher/Groups';
import GroupDetail from './pages/teacher/GroupDetail';
import StudentGroups from './pages/student/Groups';
import StudentGroupDetail from './pages/student/GroupDetail';
import CreateTest from './pages/teacher/CreateTest';
import TakeTest from './pages/student/TakeTest';
import HomeworkDetail from './pages/student/HomeworkDetail';
import ReviewHomework from './pages/teacher/ReviewHomework';
import ReviewTest from './pages/teacher/ReviewTest';
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
                  <Route path="/test/:id" element={<TakeTest />} />
                  <Route path="/homework/:id" element={<HomeworkDetail />} />
                  <Route path="/teacher/homework/:id" element={<ReviewHomework />} />
                  <Route path="/teacher/test/:id" element={<ReviewTest />} />
                  <Route path="/my-courses" element={<MyCourses />} />
                  <Route path="/submissions" element={<MySubmissions />} />
                  <Route path="/teacher" element={<TeacherDashboard />} />
                  <Route path="/teacher/create-course" element={<CreateCourse />} />
                  <Route path="/teacher/course/:id" element={<ManageCourse />} />
                  <Route path="/teacher/course/:courseId/create-test" element={<CreateTest />} />
                  <Route path="/teacher/course/:id/stats" element={<CourseStats />} />
                  <Route path="/teacher/course/:courseId/student/:studentId" element={<StudentDetails />} />
                  <Route path="/teacher/assignment/:id" element={<ReviewAssignment />} />
                  <Route path="/teacher/groups" element={<Groups />} />
                  <Route path="/teacher/group/:id" element={<GroupDetail />} />
                  <Route path="/groups" element={<StudentGroups />} />
                  <Route path="/group/:id" element={<StudentGroupDetail />} />
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

