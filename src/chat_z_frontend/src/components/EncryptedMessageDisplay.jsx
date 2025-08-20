import { useState } from 'react';
import { useChat } from '../hooks/ChatProvider.jsx';
import { useAuth } from '../hooks/Auth.jsx';

const EncryptedMessageDisplay = ({ encryptedMessage, showChannelInfo = false }) => {
  const { decryptMessage, decryptedMessages, currentChannel } = useChat();
  const { currentUser } = useAuth();
  const [isDecrypting, setIsDecrypting] = useState(false);

  const formatTime = (timestamp) => {
    const date = new Date(Number(timestamp) / 1000000); // Convert from nanoseconds
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

const isMember = currentChannel?.members?.some(member => member.toText() === currentUser.user_principal.toText());
  const isOwnMessage = () => {
    return currentUser && encryptedMessage.author.toText() === currentUser.user_principal.toText();
  };

  const handleDecrypt = async () => {
    if (!isMember) return; // Prevent decryption if not a member
    setIsDecrypting(true);
    await decryptMessage(encryptedMessage.id);
    setIsDecrypting(false);
  };

  const isDecrypted = decryptedMessages[encryptedMessage.id];
  const isOwn = isOwnMessage();

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
          isOwn 
            ? 'bg-gradient-to-r from-purple-400 to-pink-500' 
            : 'bg-gradient-to-r from-yellow-400 to-red-500'
        }`}>
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        
        {/* Message content */}
        <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={`px-3 py-2 rounded-lg border-2 border-dashed ${
            isOwn 
              ? 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 text-purple-900' 
              : 'bg-gradient-to-r from-yellow-50 to-red-50 border-yellow-300 text-yellow-900'
          }`}>
            
            {isDecrypted ? (
              <div>
                <p className="text-sm whitespace-pre-wrap break-words font-medium overflow-hidden">
                  {decryptedMessages[encryptedMessage.id].length > 100 
                    ? `${decryptedMessages[encryptedMessage.id].substring(0, 100)}...` 
                    : decryptedMessages[encryptedMessage.id]}
                </p>
                <div className="mt-1.5 pt-1.5 border-t border-current opacity-75">
                  <p className="text-xs">✓ Decrypted with VetKeys</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
                  {encryptedMessage.encrypted_content.substring(0, 40)}...
                </p>
                {isMember && (
                  <button
                    onClick={handleDecrypt}
                    disabled={isDecrypting}
className={`text-xs px-2 sm:px-3 py-1 rounded-full border transition-colors ${
                      isDecrypting
                        ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                        : 'border-current hover:bg-current hover:text-white'
                    }`}
                  >
                  {isDecrypting ? (
                    <div className="flex items-center space-x-1">
                      <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Decrypting...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                      <span>Decrypt</span>
                    </div>
                  )}
                  </button>
                )}
                {!isMember && (
                  <p className="text-xs text-yellow-600">
                    🔒 Members only - Join channel to decrypt
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className={`flex items-center gap-x-1 mt-1 text-xs text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span>{isDecrypted ? '🔐' : '🔒'}</span>
            <span>{formatTime(encryptedMessage.timestamp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptedMessageDisplay;
