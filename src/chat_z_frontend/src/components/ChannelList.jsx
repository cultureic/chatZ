import { useState } from 'react';
import { useAuth } from '../hooks/Auth.jsx';

const ChannelList = ({ channels, currentChannel, onChannelSelect, onCreateChannel }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const { currentUser } = useAuth();

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (channelName.trim()) {
      onCreateChannel(channelName.trim(), channelDescription.trim() || null);
      setChannelName('');
      setChannelDescription('');
      setShowCreateForm(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert from nanoseconds
    return date.toLocaleDateString();
  };

  const isUserMember = (channel) => {
    return currentUser && channel.members.some(member => 
      member.toText() === currentUser.user_principal.toText()
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Create Channel Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleCreateChannel} className="space-y-3">
            <input
              type="text"
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="Channel name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <textarea
              value={channelDescription}
              onChange={(e) => setChannelDescription(e.target.value)}
              placeholder="Channel description (optional)"
              rows="2"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setChannelName('');
                  setChannelDescription('');
                }}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-md"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto">
        {channels.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No channels yet</p>
            <p className="text-xs mt-1">Create the first channel!</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {channels.map((channel) => {
              const isMember = isUserMember(channel);
              const isSelected = currentChannel && currentChannel.id === channel.id;
              
              return (
                <div
                  key={channel.id}
                  onClick={() => onChannelSelect(channel)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-100 border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-blue-800' : 'text-gray-900'
                        }`}>
                          #{channel.name}
                        </span>
                        {isMember && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Member
                          </span>
                        )}
                      </div>
                      {channel.description && (
                        <p className={`text-xs mt-1 truncate ${
                          isSelected ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {channel.description[0]}
                        </p>
                      )}
                      <div className={`text-xs mt-1 ${
                        isSelected ? 'text-blue-600' : 'text-gray-400'
                      }`}>
                        {channel.members.length} members • Created {formatTime(channel.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {channels.length} channel{channels.length !== 1 ? 's' : ''} available
        </div>
      </div>
    </div>
  );
};

export default ChannelList;
