import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/Auth';
import { ChatProvider } from './hooks/Chat';
import Landing from './components/Landing';
import UserRegistration from './components/UserRegistration';
import ChatInterface from './components/ChatInterface';
import './index.css';

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuth, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chat-primary via-purple-500 to-chat-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading Chat Z...</p>
        </div>
      </div>
    );
  }

  return isAuth ? children : <Navigate to="/" replace />;
};

// User registration wrapper
const RegistrationWrapper = ({ children }) => {
  const { user, isAuth, isLoading } = useAuth();
  
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-chat-primary via-purple-500 to-chat-secondary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <UserRegistration />;
};

// Main App Routes
const AppRoutes = () => {
  const { isAuth, user } = useAuth();
  
  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuth ? (
            user ? <Navigate to="/chat" replace /> : <Navigate to="/register" replace />
          ) : (
            <Landing />
          )
        } 
      />
      <Route
        path="/register"
        element={
          <ProtectedRoute>
            <UserRegistration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <RegistrationWrapper>
              <ChatProvider>
                <ChatInterface />
              </ChatProvider>
            </RegistrationWrapper>
          </ProtectedRoute>
        }
      />
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
