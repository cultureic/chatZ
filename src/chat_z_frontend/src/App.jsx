import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/Auth.jsx';
import { useChat } from './hooks/ChatProvider.jsx';

// Components
import Header from './components/Header.jsx';
import LoginPage from './components/LoginPage.jsx';
import ChatRoom from './components/ChatRoom.jsx';
import ChannelList from './components/ChannelList.jsx';
import UserProfile from './components/UserProfile.jsx';
import MessageDisplay from './components/MessageDisplay.jsx';

function App() {
  const { isAuth, login, logout, currentUser, registerUser, messages } = useAuth();
  const { channels, currentChannel, selectChannel, createChannel } = useChat();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    // Handle routing based on auth state
    if (!isAuth) {
      navigate('/');
    } else {
      // If authenticated, redirect to chat
      navigate('/chat');
    }
  }, [isAuth, navigate]);

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleRegister = async (username, bio) => {
    const result = await registerUser(username, bio);
    if (result) {
      navigate('/chat');
    }
  };

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Routes>
          <Route 
            path="/*" 
            element={
              <LoginPage 
                onLogin={handleLogin}
                onRegister={handleRegister}
                isLoading={false}
              />
            } 
          />
        </Routes>
        
        {/* Message notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`px-4 py-2 rounded-lg shadow-lg ${
                message.type === 'success' ? 'bg-green-500 text-white' :
                message.type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show registration form if authenticated but not registered
  if (isAuth && !currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div>
              <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Complete Your Profile
              </h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                You're logged in! Now create your Chat Z profile.
              </p>
            </div>
            <form className="mt-8 space-y-6" onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const username = formData.get('username');
              const bio = formData.get('bio');
              handleRegister(username, bio || null);
            }}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <input
                    name="username"
                    type="text"
                    required
                    placeholder="Choose a username"
                    className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  />
                </div>
                <div>
                  <textarea
                    name="bio"
                    placeholder="Tell us about yourself (optional)"
                    rows="3"
                    className="appearance-none rounded-b-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm resize-none"
                  />
                </div>
              </div>
              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Complete Registration
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Message notifications */}
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`px-4 py-2 rounded-lg shadow-lg ${
                message.type === 'success' ? 'bg-green-500 text-white' :
                message.type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header 
        user={currentUser}
        onLogout={handleLogout}
        onProfileClick={() => setShowProfile(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        <Routes>
          <Route 
            path="/chat" 
            element={
              <div className="flex flex-1">
                <div className="w-64 bg-white shadow-lg">
                  <ChannelList 
                    channels={channels}
                    currentChannel={currentChannel}
                    onChannelSelect={selectChannel}
                    onCreateChannel={createChannel}
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  {currentChannel ? (
                    <>
                      <div className="flex-1 overflow-y-auto p-4">
                        <MessageDisplay />
                      </div>
                      <div className="border-t bg-white p-4">
                        <ChatRoom />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-600 mb-2">
                          Welcome to Chat Z!
                        </h2>
                        <p className="text-gray-500">
                          Select a channel to start chatting
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            } 
          />
          <Route path="/*" element={<div>Redirecting to chat...</div>} />
        </Routes>
      </div>

      {/* User Profile Modal */}
      {showProfile && (
        <UserProfile 
          user={currentUser}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Message notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`px-4 py-2 rounded-lg shadow-lg ${
              message.type === 'success' ? 'bg-green-500 text-white' :
              message.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
