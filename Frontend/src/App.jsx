import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InstructionsPage from './pages/InstructionsPage';
import Puzzle1 from './pages/Puzzle-1';
import Puzzle2 from './pages/Puzzle-2';
import Puzzle3 from './pages/Puzzle-3';
import Puzzle4 from './pages/Puzzle-4';
import Puzzle5 from './pages/Puzzle-5';
import './App.css';
import Maingate from './pages/Maingate';
function App() {


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
          </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
