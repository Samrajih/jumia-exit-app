import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import LineManager from "./pages/LineManager";
import HR from "./pages/HR";
import Finance from "./pages/Finance";
import IT from "./pages/IT";

// Protected Route component
function ProtectedRoute({ children }) {
  const role = sessionStorage.getItem("userRole");
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <Admin />
          </ProtectedRoute>
        } />
        
        <Route path="/line-manager/:id" element={
          <ProtectedRoute>
            <LineManager />
          </ProtectedRoute>
        } />
        
        <Route path="/hr/:id" element={
          <ProtectedRoute>
            <HR />
          </ProtectedRoute>
        } />
        
        <Route path="/finance/:id" element={
          <ProtectedRoute>
            <Finance />
          </ProtectedRoute>
        } />
        
        <Route path="/it/:id" element={
          <ProtectedRoute>
            <IT />
          </ProtectedRoute>
        } />
        
        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;