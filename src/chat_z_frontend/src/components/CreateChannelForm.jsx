
import { useState, useRef, useEffect } from 'react';

const CreateChannelForm = ({ onCreateChannel, onDismiss }) => {
  const formRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        onDismiss();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onDismiss]);
  const [showForm, setShowForm] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (channelName.trim()) {
      onCreateChannel({
        name: channelName.trim(),
        description: channelDescription.trim() || null,
        isEncrypted,
        password: isEncrypted ? password.trim() : null,
      });
      setChannelName('');
      setChannelDescription('');
      setIsEncrypted(false);
      setPassword('');
    }
      onDismiss();
  }

  return (
<div className="fixed inset-0 bg-black bg-opacity-50 z-[60]" onClick={onDismiss}>
      <div ref={formRef} onClick={e => e.stopPropagation()} className="fixed bottom-0 left-0 right-0 bg-white px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:pb-4 pt-2 sm:pt-3 border-t border-gray-200 shadow-lg">
      {/* Create Button */}
<div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-gray-900">New Channel</h3>
        <button
          type="button"
onClick={onDismiss}
          className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Form */}
<form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="channel-name" className="block text-sm font-medium text-gray-700">
            Channel Name
          </label>
          <input
            type="text"
            id="channel-name"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., #general"
            required
          />
        </div>
        <div>
          <label htmlFor="channel-description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <input
            type="text"
            id="channel-description"
            value={channelDescription}
            onChange={(e) => setChannelDescription(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="What is this channel about?"
          />
        </div>
        <div className="flex items-center">
          <input
            id="encrypted-channel"
            type="checkbox"
            checked={isEncrypted}
            onChange={(e) => setIsEncrypted(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="encrypted-channel" className="ml-2 block text-sm text-gray-900">
            Encrypted Channel
          </label>
        </div>
        {isEncrypted && (
          <div>
            <label htmlFor="channel-password"
                   className="block text-sm font-medium text-gray-700">
              Password (Optional)
            </label>
            <input
              type="password"
              id="channel-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Leave blank for no password"
            />
          </div>
        )}
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Create Channel
        </button>
      </form>
    </div>
    </div>
  );
};

export default CreateChannelForm;

