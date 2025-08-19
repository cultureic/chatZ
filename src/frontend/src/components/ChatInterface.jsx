import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/Auth';
import { useChat } from '../hooks/Chat';
import { 
  Send, 
  Hash, 
  Users, 
  Plus, 
  LogOut, 
  Image,
  MessageCircle,
  User,
  Settings,
  Smile
} from 'lucide-react';

const ChatInterface = () => {
  const { user, logout, principalText } = useAuth();
  const { 
    messages, 
    channels, 
    currentChannel, 
    setCurrentChannel,
    sendMessage,
    createChannel,
    joinChannel,
    isLoading,
    stats
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [showChannelForm, setShowChannelForm] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDescription, setNewChannelDescription] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;

    try {
      setIsSending(true);
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    
    if (!newChannelName.trim()) return;

    try {
      await createChannel(
        newChannelName.trim(),
        newChannelDescription.trim() || null
      );
      setNewChannelName('');
      setNewChannelDescription('');
      setShowChannelForm(false);
    } catch (error) {
      console.error('Failed to create channel:', error);
      alert('Failed to create channel: ' + error.message);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) / 1000000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* User Info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-chat-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {principalText?.slice(0, 8)}...
              </p>
            </div>
            <button
              onClick={logout}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-chat-primary">{stats.users}</div>
              <div className="text-xs text-gray-500">Users</div>
            </div>
            <div>
              <div className="text-lg font-bold text-chat-primary">{stats.messages}</div>
              <div className="text-xs text-gray-500">Messages</div>
            </div>
            <div>
              <div className="text-lg font-bold text-chat-primary">{stats.channels}</div>
              <div className="text-xs text-gray-500">Channels</div>
            </div>
          </div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Channels
              </h3>
              <button
                onClick={() => setShowChannelForm(true)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Create Channel"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setCurrentChannel(channel)}
                  className={`w-full flex items-center space-x-2 p-2 rounded-lg text-left transition-colors ${
                    currentChannel?.id === channel.id
                      ? 'bg-chat-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Hash className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{channel.name}</span>
                  <span className="text-xs opacity-75 ml-auto">
                    {Number(channel.message_count)}
                  </span>
                </button>
              ))}
            </div>

            {/* Create Channel Form */}
            {showChannelForm && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <form onSubmit={handleCreateChannel} className="space-y-3">
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    placeholder="Channel name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chat-primary focus:border-transparent text-sm"
                    autoFocus
                  />
                  <textarea
                    value={newChannelDescription}
                    onChange={(e) => setNewChannelDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-chat-primary focus:border-transparent text-sm resize-none"
                  />
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      disabled={!newChannelName.trim()}
                      className="flex-1 bg-chat-primary text-white py-1 px-3 rounded text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChannelForm(false);
                        setNewChannelName('');
                        setNewChannelDescription('');
                      }}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <Hash className="w-5 h-5 text-gray-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentChannel?.name || 'Select a channel'}
              </h2>
              {currentChannel?.description && (
                <p className="text-sm text-gray-500">{currentChannel.description}</p>
              )}
            </div>
            <div className="ml-auto flex items-center space-x-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{currentChannel?.members?.length || 0} members</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {currentChannel 
                  ? `No messages yet in #${currentChannel.name}. Be the first to say something!`
                  : 'Select a channel to start chatting'
                }
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const showDate = index === 0 || 
                formatDate(messages[index - 1].timestamp) !== formatDate(message.timestamp);
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                        {formatDate(message.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-chat-primary to-chat-secondary rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {message.author_username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline space-x-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {message.author_username}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(message.timestamp)}
                        </span>
                      </div>
                      <div className="text-gray-800 break-words">
                        {message.content}
                      </div>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2">
                          {message.attachments.map((attachment, idx) => (
                            <div key={idx} className="text-sm text-gray-500 flex items-center space-x-1">
                              <Image className="w-4 h-4" />
                              <span>{attachment.filename}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {currentChannel && (
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={`Message #${currentChannel.name}`}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-chat-primary focus:border-transparent"
                  disabled={isSending}
                  maxLength="2000"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Add emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>
              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                className="bg-chat-primary text-white p-3 rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
