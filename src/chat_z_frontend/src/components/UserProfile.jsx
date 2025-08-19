import { useState } from 'react';
import { useAuth } from '../hooks/Auth.jsx';

const UserProfile = ({ user, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio?.[0] || '');
  const { updateUser, isLoading } = useAuth();

  const handleSave = async () => {
    const updates = {};
    
    if (username !== user?.username) {
      updates.username = [username];
    }
    
    const currentBio = user?.bio?.[0] || '';
    if (bio !== currentBio) {
      updates.bio = bio ? [bio] : [];
    }

    if (Object.keys(updates).length > 0) {
      await updateUser(updates);
    }
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    setUsername(user?.username || '');
    setBio(user?.bio?.[0] || '');
    setIsEditing(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <div className="h-20 w-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {user.username ? user.username[0].toUpperCase() : '?'}
                </span>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter username"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {user.username || 'No username'}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-md min-h-[80px]">
                  {user.bio && user.bio[0] ? user.bio[0] : 'No bio added yet'}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Stats</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Messages</p>
                  <p className="text-lg font-semibold text-gray-900">{user.message_count.toString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-lg font-semibold text-gray-900">{formatTime(user.joined_at)}</p>
                </div>
              </div>
            </div>

            {/* Principal ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal ID
              </label>
              <p className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded-md font-mono break-all">
                {user.user_principal.toText()}
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
