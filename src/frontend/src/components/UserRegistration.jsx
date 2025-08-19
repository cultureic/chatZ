import React, { useState } from 'react';
import { useAuth } from '../hooks/Auth';
import { User, MessageCircle } from 'lucide-react';

const UserRegistration = ({ onRegistered }) => {
  const { registerUser, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (formData.username.length > 50) {
      setError('Username must be less than 50 characters');
      return;
    }

    try {
      setIsRegistering(true);
      setError('');
      
      const user = await registerUser(
        formData.username.trim(),
        formData.bio.trim() || null
      );
      
      console.log('User registered successfully:', user);
      if (onRegistered) {
        onRegistered(user);
      }
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Failed to register user');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-chat-primary via-purple-500 to-chat-secondary flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome to Chat Z! 🐆
          </h2>
          <p className="text-white/80">
            Complete your profile to start chatting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-white font-medium mb-2">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              maxLength="50"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-chat-accent focus:border-transparent transition-all"
              disabled={isLoading || isRegistering}
            />
            <p className="text-white/60 text-sm mt-1">
              {formData.username.length}/50 characters
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-white font-medium mb-2">
              Bio (Optional)
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows="3"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-chat-accent focus:border-transparent transition-all resize-none"
              disabled={isLoading || isRegistering}
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isRegistering || !formData.username.trim()}
            className="w-full bg-chat-accent hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isRegistering ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Profile...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <MessageCircle className="w-5 h-5" />
                <span>Join the Chat</span>
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm">
            By joining, you agree to our decentralized community guidelines
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
