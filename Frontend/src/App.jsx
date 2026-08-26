import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InstructionsPage from './pages/InstructionsPage';
import Puzzle1 from './pages/Puzzle-1';
import Puzzle2 from './pages/Puzzle-2';
import Puzzle3 from './pages/Puzzle-3';
import Puzzle4 from './pages/Puzzle-4';
import Puzzle5 from './pages/Puzzle-5';
import Maingate from './pages/Maingate';
function App() {

// Admin imports
import { AuthProvider } from './admin/auth/AuthContext';
import ProtectedRoute from './admin/auth/ProtectedRoute';
import ToastContainer from './admin/components/Toast';
import LoginPage from './admin/pages/LoginPage';
import DashboardPage from './admin/pages/DashboardPage';
import QuestionsPage from './admin/pages/questions/QuestionsPage';
import CreateQuestionPage from './admin/pages/questions/CreateQuestionPage';
import BulkUploadQuestionsPage from './admin/pages/questions/BulkUploadQuestionsPage';
import SetsPage from './admin/pages/sets/SetsPage';
import GenerateSetsPage from './admin/pages/sets/GenerateSetsPage';
import StudentsPage from './admin/pages/students/StudentsPage';
import CreateStudentPage from './admin/pages/students/CreateStudentPage';
import BulkCreatePage from './admin/pages/students/BulkCreatePage';
import StudentDetailPage from './admin/pages/students/StudentDetailPage';
import MapsPage from './admin/pages/maps/MapsPage';
import CreateMapPage from './admin/pages/maps/CreateMapPage';
import RouteKeysPage from './admin/pages/routes/RouteKeysPage';
import MembersPage from './admin/pages/members/MembersPage';
import AddMemberPage from './admin/pages/members/AddMemberPage';
import SettingsPage from './admin/pages/settings/SettingsPage';

// Import Neo-Brutalist CSS for admin panel
import './admin/admin.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* ── Student Game Routes (Unchanged) ── */}
          <Route path="/login" element={<LandingPage />} />
          <Route path="/Instructions" element={<InstructionsPage />} />
          <Route path="/puzzle-1" element={<Puzzle1 />} />
          <Route path="/puzzle-2" element={<Puzzle2 />} />
          <Route path="/puzzle-3" element={<Puzzle3 />} />
          <Route path="/puzzle-4" element={<Puzzle4 />} />
          <Route path="/puzzle-5" element={<Puzzle5 />} />

          {/* ── Admin Panel Routes ── */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute>
                <QuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions/create"
            element={
              <ProtectedRoute>
                <CreateQuestionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions/upload"
            element={
              <ProtectedRoute>
                <BulkUploadQuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sets"
            element={
              <ProtectedRoute>
                <SetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/sets/generate"
            element={
              <ProtectedRoute>
                <GenerateSetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/create"
            element={
              <ProtectedRoute>
                <CreateStudentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/bulk-create"
            element={
              <ProtectedRoute>
                <BulkCreatePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students/:id"
            element={
              <ProtectedRoute>
                <StudentDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/maps"
            element={
              <ProtectedRoute>
                <MapsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/maps/create"
            element={
              <ProtectedRoute>
                <CreateMapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/routes"
            element={
              <ProtectedRoute>
                <RouteKeysPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members"
            element={
              <ProtectedRoute>
                <MembersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/members/add"
            element={
              <ProtectedRoute>
                <AddMemberPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}}
