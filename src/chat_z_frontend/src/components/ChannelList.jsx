import React, { useState, useCallback } from 'react';
import { useAuth } from '../hooks/Auth.jsx';
import CreateChannelForm from './CreateChannelForm.jsx';
import PasswordModal from './PasswordModal.jsx';

const ChannelList = ({ 
  channels, 
  currentChannel, 
  onChannelSelect, 
  onCreateChannel, 
  onJoinChannel,
  setShowPasswordModal,
  setChannelToJoin
}) => {
const { currentUser } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleJoinChannel = useCallback((channelId, password) => {
    onJoinChannel(channelId, password ? [password] : []);
  }, [onJoinChannel]);

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
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Search or filter area - Could be added here later */}
      <div className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search channels..."
            className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      {/* Header */}
<div className="flex flex-col space-y-2 px-4 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Channels</h1>
          {currentUser && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
        {currentUser && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="hidden sm:flex items-center justify-center space-x-1 text-xs px-3 py-1.5 text-yellow-600 bg-yellow-50 border border-yellow-300 rounded-lg hover:bg-yellow-100 transition-colors w-full">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>New Encrypted Channel</span>
          </button>
        )}
      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 'calc(140px + env(safe-area-inset-bottom))' }}>
        {channels.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No channels yet</p>
            {currentUser ? (
              <p className="text-xs mt-1">Create the first channel!</p>
            ) : (
              <p className="text-xs mt-1">Login to create channels</p>
            )}
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
                        {channel.is_encrypted && (
                          <svg className={`h-4 w-4 mr-1 ${
                            isSelected ? 'text-blue-600' : 'text-yellow-600'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        <span className={`text-sm font-medium ${
                          isSelected ? 'text-blue-800' : 'text-gray-900'
                        }`}>
                          {channel.is_encrypted ? '🔒 ' : '#'}{channel.name}
                        </span>
                        {isMember && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Member
                          </span>
                        )}
                        {channel.is_encrypted && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                            Encrypted
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
                      <div className={`flex items-center justify-between mt-1`}>
                        <div className={`text-xs ${
                          isSelected ? 'text-blue-600' : 'text-gray-400'
                        }`}>
                          {channel.members.length} members • Created {formatTime(channel.created_at)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Join button for non-members */}
                    {!isMember && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent channel selection
                          if (channel.password_hash && channel.password_hash.length > 0) {
                            setShowPasswordModal(true);
                            setChannelToJoin(channel);
                          } else {
                            handleJoinChannel(channel.id, null);
                          }
                        }}
                        className={`ml-2 px-2 py-1 text-xs rounded transition-colors ${
                          channel.is_encrypted
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border border-yellow-300'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-300'
                        }`}
                      >
                        {(channel.password_hash && channel.password_hash.length > 0) ? '🔒 Enter Password' : '+ Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

{ showCreateForm && currentUser && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Create Channel</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-400 hover:text-gray-500">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
<CreateChannelForm 
              onCreateChannel={(channel) => {
                onCreateChannel(channel);
                setShowCreateForm(false);
              }}
              onDismiss={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelList;
