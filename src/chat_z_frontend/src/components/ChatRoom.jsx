import { useState } from 'react';
import { useChat } from '../hooks/ChatProvider.jsx';
import { useAuth } from '../hooks/Auth.jsx';

const ChatRoom = () => {
  const [message, setMessage] = useState('');
  const { sendMessage, currentChannel } = useChat();
  const { isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      await sendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!currentChannel) {
    return null;
  }

  return (
    <div className="flex items-end space-x-4">
      <form onSubmit={handleSubmit} className="flex-1 flex items-end space-x-2">
        <div className="flex-1 min-w-0">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${currentChannel.name}...`}
            rows="1"
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            style={{ minHeight: '40px', maxHeight: '120px' }}
            onInput={(e) => {
              // Auto-resize textarea
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
          />
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatRoom;
