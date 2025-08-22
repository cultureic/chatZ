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
import PasswordModal from './components/PasswordModal.jsx';
import { ckPay } from 'ckpay-sdk';


function App() {
  const { isAuth, login, logout, currentUser, registerUser, messages } = useAuth();
  const { channels, currentChannel, selectChannel, createChannel, joinChannel, refreshData, encryptedMessages, decryptAllChannelMessages, loadEncryptedMessages } = useChat();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [channelToJoin, setChannelToJoin] = useState(null);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
   console.log("ckpay",ckPay)
  useEffect(() => {
    // Always go to chat - guests can view as read-only
    navigate('/chat');
  }, [navigate]);

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
      // Refresh chat data after successful registration
      if (typeof refreshData === 'function') {
        await refreshData();
        
        // After refreshing, wait a bit and then auto-select General channel (ID 1)
        setTimeout(() => {
          const generalChannel = channels.find(ch => ch.id === 1);
          if (generalChannel && !currentChannel) {
            selectChannel(generalChannel);
          }
        }, 500);
      }
      
      navigate('/chat');
    }
  };

  // Guests can now see the chat interface but with limited functionality

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
    <div className="min-h-screen flex flex-col">
      {/* Main Header - 64px height */}
      <div className="fixed top-0 left-0 right-0  bg-white shadow-sm h-16">
        <Header 
          user={currentUser}
          onLogout={handleLogout}
          onProfileClick={() => setShowProfile(true)}
          onLogin={() => setShowLoginModal(true)}
        />
      </div>

      {/* Main Content - starts after main header */}
      <div className="flex flex-1 mt-16">
        <Routes>
          <Route 
            path="/chat" 
            element={
              <div className="flex w-full h-[calc(100vh-64px)] bg-white">
                {/* Desktop Sidebar */}
                <div className="hidden lg:block w-64 bg-white border-r border-gray-200">
                  <ChannelList 
                    channels={channels}
                    currentChannel={currentChannel}
                    onChannelSelect={selectChannel}
                    onCreateChannel={createChannel}
                    onJoinChannel={joinChannel}
                    setShowPasswordModal={setShowPasswordModal}
                    setChannelToJoin={setChannelToJoin}
                  />
                </div>

                {/* Mobile Sidebar */}
                {showMobileSidebar && (
                  <div className="fixed inset-0 z-[60] lg:hidden">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
                    <div className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-xl z-50">
                      <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-semibold">Channels</h2>
                        <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-gray-500">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <ChannelList 
                        channels={channels}
                        currentChannel={currentChannel}
                        onChannelSelect={(channel) => {
                          selectChannel(channel);
                          setShowMobileSidebar(false);
                        }}
                        onCreateChannel={createChannel}
                        onJoinChannel={joinChannel}
                        setShowPasswordModal={setShowPasswordModal}
                        setChannelToJoin={setChannelToJoin}
                      />
                    </div>
                  </div>
                )}

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col bg-white relative w-full max-w-full overflow-hidden pt-12">
                  {/* Mobile Menu Button */}
                  <div className="lg:hidden flex items-center h-12 px-4 gap-2 border-b">
                    <button
                      onClick={() => setShowMobileSidebar(true)}
                      className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {currentChannel ? (
                    <div className="flex-1 flex flex-col min-h-0  p-2 ">
<div className="flex-1 overflow-y-auto overflow-x-hidden lg:pt-0 px-4 w-full max-w-full pt-4"> {/* ADD pt-4 here */}
                        <MessageDisplay 
                          setShowMobileSidebar={setShowMobileSidebar}
                          setChannelToJoin={setChannelToJoin}
                        />
                      </div>
                      <div className="border-t bg-white">
                        <ChatRoom />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center p-4">
                      <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Chat Z!</h2>
                        <p className="text-gray-500 mb-4">
                          {/* Show different message on mobile */}
                          <span className="lg:hidden">Tap the menu to select a channel</span>
                          <span className="hidden lg:inline">Select a channel to start chatting</span>
                        </p>
                        <button
                          onClick={() => setShowMobileSidebar(true)}
                          className="lg:hidden px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                        >
                          Browse Channels
                        </button>
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
      
      {/* Login Modal for Guests */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Login to Chat Z</h2>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <LoginPage 
                onLogin={() => {
                  handleLogin();
                  setShowLoginModal(false);
                }}
                onRegister={(username, bio) => {
                  handleRegister(username, bio);
                  setShowLoginModal(false);
                }}
                isLoading={false}
                isModal={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Message notifications */}
      <div className="fixed z-50 space-y-2 sm:top-20 sm:right-4 sm:w-auto w-full bottom-[88px] sm:bottom-auto px-4 sm:px-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`px-4 py-2 rounded-lg shadow-lg flex justify-center sm:justify-start max-w-[90%] sm:max-w-none mx-auto sm:mx-0 ${
              message.type === 'success' ? 'bg-green-500 text-white' :
              message.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      {/* Password Modal */}
      {showPasswordModal && channelToJoin && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/75 transition-opacity" />
          <div className="relative z-[10000] w-full max-w-lg p-6 bg-white rounded-xl shadow-2xl">
            <PasswordModal
              channelName={channelToJoin.name}
              needsPassword={Boolean(channelToJoin.password_hash && channelToJoin.password_hash.length > 0)}
              onSubmit={(password) => {
                joinChannel(channelToJoin.id, password ? [password] : []);
                setShowPasswordModal(false);
                setChannelToJoin(null);
              }}
              onCancel={() => {
                setShowPasswordModal(false);
                setChannelToJoin(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
