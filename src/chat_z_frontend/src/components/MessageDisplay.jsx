import { useChat } from '../hooks/ChatProvider.jsx';
import { useAuth } from '../hooks/Auth.jsx';
import { useEffect, useRef, useState } from 'react';
import EncryptedMessageDisplay from './EncryptedMessageDisplay.jsx';

const MessageDisplay = ({ setShowMobileSidebar, setChannelToJoin }) => {
  const { 
    messages, 
    currentChannel, 
    encryptedMessages,
    decryptedMessages,
    loadEncryptedMessages,
    decryptAllChannelMessages 
  } = useChat();
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, encryptedMessages]);

  // Load encrypted messages when channel changes - for guests show as ciphertext, for users show normal encrypted messages
  const [ciphertextMessages, setCiphertextMessages] = useState([]);
  
  useEffect(() => {
    const loadChannelMessages = async () => {
      if (currentChannel && currentChannel.is_encrypted) {
        // For guests: load and show as ciphertext
        // For authenticated users: load encrypted messages and auto-decrypt
        if (!currentUser) {
          try {
            const encryptedMsgs = await loadEncryptedMessages(currentChannel.id);
            
            // Format encrypted messages for ciphertext display (guests only)
            // Convert messages first, then we'll sort them by date like regular messages
            const ciphertextMsgs = (encryptedMsgs || []).map(msg => ({
              id: msg.id,
              author: msg.author,
              author_username: '🔒 Encrypted User',
              content: `🔐 [ENCRYPTED] ${msg.encrypted_content.substring(0, 40)}...`,
              timestamp: msg.timestamp,
              reply_to: msg.reply_to,
              message_type: msg.message_type,
              attachments: msg.attachments || [],
              is_ciphertext: true
            }));
            
            setCiphertextMessages(ciphertextMsgs);
          } catch (error) {
            console.error('Error loading encrypted messages for ciphertext display:', error);
            setCiphertextMessages([]);
          }
        } else {
          // For authenticated users: load encrypted messages and auto-decrypt if member
          setCiphertextMessages([]);
          
          try {
            // Check if user is a member of this encrypted channel
            const isMember = currentChannel.members.some(member => 
              member.toText ? member.toText() === currentUser.user_principal.toText() : member.toString() === currentUser.user_principal.toText()
            );
            
            if (isMember) {
              // Load encrypted messages first
              await loadEncryptedMessages(currentChannel.id);
              
              // Then auto-decrypt all messages for better UX
              setTimeout(() => {
                decryptAllChannelMessages(currentChannel.id);
              }, 1000); // Small delay to let encrypted messages load first
            }
          } catch (error) {
            console.error('Error auto-loading encrypted messages:', error);
          }
        }
      } else {
        setCiphertextMessages([]);
      }
    };
    
    loadChannelMessages();
  }, [currentChannel, currentUser]);

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

  const isOwnMessage = (message) => {
    return currentUser && message.author.toText() === currentUser.user_principal.toText();
  };

  if (!currentChannel) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No channel selected</h3>
          <p className="text-gray-500">Choose a channel to start chatting</p>
        </div>
      </div>
    );
  }

  // Create unified message timeline for encrypted channels
  const getUnifiedMessages = () => {
    if (!currentChannel.is_encrypted || !currentUser) {
      return messages || []; // Regular channels or guest users - use regular messages only
    }
    
    // For encrypted channels with authenticated users, merge regular and decrypted encrypted messages
    const unifiedMessages = messages ? [...messages] : [];
    
    // Add decrypted encrypted messages to the timeline
    encryptedMessages?.forEach(encMsg => {
      const decryptedContent = decryptedMessages?.[encMsg.id];
      if (decryptedContent) {
        // Convert encrypted message to regular message format with decrypted content
        const decryptedMsg = {
          id: `enc_${encMsg.id}`, // Prefix to avoid ID conflicts
          author: encMsg.author,
          author_username: '🔐 ' + (currentUser.user_principal.toText() === encMsg.author.toText() ? '' : 'Encrypted User'),
          content: decryptedContent,
          timestamp: encMsg.timestamp,
          reply_to: encMsg.reply_to,
          message_type: encMsg.message_type,
          attachments: encMsg.attachments || [],
          is_decrypted: true,
          original_encrypted_id: encMsg.id
        };
        unifiedMessages.push(decryptedMsg);
      }
    });
    
    return unifiedMessages;
  };

  // Show empty state only when there are no messages of any type
  const hasAnyMessages = (messages?.length > 0) || (currentChannel.is_encrypted && ((encryptedMessages?.length > 0) || (ciphertextMessages?.length > 0)));

  // Combine all messages for unified handling
  const currentMessages = !currentUser && currentChannel.is_encrypted ? ciphertextMessages : getUnifiedMessages();

  // Group messages by date first
  const messagesByDate = {};
  currentMessages?.forEach(message => {
    const dateKey = formatDate(message.timestamp);
    if (!messagesByDate[dateKey]) {
      messagesByDate[dateKey] = [];
    }
    messagesByDate[dateKey].push(message);
  });

  // Sort messages within each day oldest to newest (so newest appears at bottom)
  Object.values(messagesByDate).forEach(dayMessages => {
    dayMessages.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  });

  // Convert to array and sort days oldest to newest (Yesterday first, then Today)
  const sortedDays = Object.entries(messagesByDate).sort((a, b) => {
    // Get the oldest message from each day (it's the first one after sorting above)
    const aOldestMsg = a[1][0];
    const bOldestMsg = b[1][0];
    return Number(aOldestMsg.timestamp) - Number(bOldestMsg.timestamp);
  });

  if (!hasAnyMessages) {
    return (
      <div className="flex flex-col h-full">
        {/* Channel header */}
        <div className="p-2 sm:p-4 border-b border-gray-200 bg-white">
          {/* Main channel info */}
          <div className="flex items-center justify-between">

            {/* Encrypted channel controls - Desktop */}
            {currentChannel.is_encrypted && (
              <div className="hidden sm:flex space-x-2">
                <button
                  onClick={() => loadEncryptedMessages(currentChannel.id)}
                  className="px-3 py-1 text-xs text-yellow-600 border border-yellow-300 rounded hover:bg-yellow-50 transition-colors"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => decryptAllChannelMessages(currentChannel.id)}
                  className="px-3 py-1 text-xs text-white bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                >
                  🔓 Decrypt
                </button>
              </div>
            )}

            {/* Encrypted channel controls - Mobile */}
            {currentChannel.is_encrypted && (
              <div className="sm:hidden">
                <button
                  onClick={() => loadEncryptedMessages(currentChannel.id)}
                  className="p-1.5 text-yellow-600 border border-yellow-300 rounded hover:bg-yellow-50 transition-colors mr-2"
                  title="Refresh Encrypted Messages"
                >
                  🔄
                </button>
                <button
                  onClick={() => decryptAllChannelMessages(currentChannel.id)}
                  className="p-1.5 text-white bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                  title="Decrypt All Messages"
                >
                  🔓
                </button>
              </div>
            )}
          </div>
          
          {/* Channel Info */}
          <div className="mt-2 text-xs text-gray-600 flex items-center gap-x-3 overflow-x-auto whitespace-nowrap">
            <span>
              👥 {currentChannel.members.length} member{currentChannel.members.length !== 1 ? 's' : ''}
            </span>
            {currentChannel.is_encrypted && encryptedMessages?.length > 0 && (
              <span className="text-yellow-600">
                🔐 {encryptedMessages.length} encrypted
              </span>
            )}
            {currentChannel.description?.[0] && (
              <span className="text-gray-500 truncate">
                • {currentChannel.description[0]}
              </span>
            )}
          </div>
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="h-16 w-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10v-1a6 6 0 112 0v1m2 6V9a6 6 0 10-12 0v1m12 0a1 1 0 01-1 1H6a1 1 0 01-1-1V9a1 1 0 011-1h12a1 1 0 011 1z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500">
              {currentChannel.is_encrypted ? 'Send an encrypted message to' : 'Start the conversation in'} #{currentChannel.name}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Channel header */}
      <div className="flex flex-col border-b border-gray-200 bg-white">
        {/* Mobile Menu Button */}
        {/* <div className="lg:hidden flex items-center h-12 px-4 gap-2">
          <button
            onClick={() => setShowMobileSidebar(true)}
            className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div> */}

        <div className="p-2 sm:p-4">
          {/* Main channel info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 min-w-0">
              <button
                onClick={() => setChannelToJoin(currentChannel)}
                className="text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors truncate"
              >
                {currentChannel.is_encrypted ? '🔒 ' : '#'}{currentChannel.name}
              </button>
              {currentChannel.is_encrypted && (
                <span className="hidden sm:inline-flex px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Encrypted
                </span>
              )}
            </div>

            {/* Encrypted channel controls - Desktop */}
            {currentChannel.is_encrypted && (
              <div className="hidden sm:flex space-x-2">
                <button
                  onClick={() => loadEncryptedMessages(currentChannel.id)}
                  className="px-3 py-1 text-xs text-yellow-600 border border-yellow-300 rounded hover:bg-yellow-50 transition-colors"
                >
                  🔄 Refresh
                </button>
                <button
                  onClick={() => decryptAllChannelMessages(currentChannel.id)}
                  className="px-3 py-1 text-xs text-white bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                >
                  🔓 Decrypt
                </button>
              </div>
            )}

            {/* Encrypted channel controls - Mobile */}
            {currentChannel.is_encrypted && (
              <div className="sm:hidden">
                <button
                  onClick={() => loadEncryptedMessages(currentChannel.id)}
                  className="p-1.5 text-yellow-600 border border-yellow-300 rounded hover:bg-yellow-50 transition-colors mr-2"
                  title="Refresh Encrypted Messages"
                >
                  🔄
                </button>
                <button
                  onClick={() => decryptAllChannelMessages(currentChannel.id)}
                  className="p-1.5 text-white bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                  title="Decrypt All Messages"
                >
                  🔓
                </button>
              </div>
            )}
          </div>
          {/* Channel Info */}
          <div className="mt-2 text-xs text-gray-600 flex items-center gap-x-3 overflow-x-auto whitespace-nowrap">
            <span>
              👥 {currentChannel.members.length} member{currentChannel.members.length !== 1 ? 's' : ''}
            </span>
            {currentChannel.is_encrypted && encryptedMessages?.length > 0 && (
              <span className="text-yellow-600">
                🔐 {encryptedMessages.length} encrypted
              </span>
            )}
            {currentChannel.description?.[0] && (
              <span className="text-gray-500 truncate">
                • {currentChannel.description[0]}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages - Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 space-y-3 sm:space-y-4 max-w-full">
        {sortedDays && sortedDays.map(([date, dayMessages]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${!currentUser && currentChannel.is_encrypted ? 'border-yellow-300' : 'border-gray-300'}`} />
              </div>
              <div className="relative flex justify-center">
                <span className={`px-4 text-sm font-medium ${!currentUser && currentChannel.is_encrypted ? 'bg-yellow-50 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                  {date}
                </span>
              </div>
            </div>

            {/* Messages for this date */}
            <div className="mt-4 space-y-3">
              {/* Each date group is sorted oldest to newest (newest at bottom) */}
              {dayMessages.map((message) => {
                const isOwn = isOwnMessage(message);
                const isDecrypted = message.is_decrypted;
                const isGuest = !currentUser && currentChannel.is_encrypted;
                
                return (
                  <div
                    key={message.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-2 max-w-[85%] ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
                        isGuest
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          : (isDecrypted
                              ? (isOwn ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gradient-to-r from-yellow-500 to-red-500')
                              : (isOwn 
                                  ? 'bg-gradient-to-r from-purple-400 to-blue-500' 
                                  : 'bg-gradient-to-r from-green-400 to-blue-500'))
                      }`}>
                        <span className="text-white font-medium text-sm">
                          {isGuest ? '🔒' : (isDecrypted ? '🔐' : (message.author_username ? message.author_username[0].toUpperCase() : '?'))}
                        </span>
                      </div>
                      
                      {/* Message content */}
                      <div className={`flex flex-col max-w-full ${isOwn ? 'items-end' : 'items-start'}`}>
                        <div className={`px-3 py-2 rounded-lg ${
                          isGuest
                            ? 'bg-yellow-50 border border-yellow-300'
                            : (isDecrypted
                                ? (isOwn 
                                    ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 text-yellow-900'
                                    : 'bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-yellow-300 text-yellow-900')
                                : (isOwn 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-white border border-gray-200 text-gray-900'))
                        }`}>
                          {isDecrypted && !isGuest && (
                            <div className="flex items-center space-x-1 mb-2">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                              </svg>
                              <span className="text-xs font-semibold opacity-75">DECRYPTED</span>
                            </div>
                          )}
                          <p className={`text-sm whitespace-pre-wrap break-all ${isGuest ? 'text-yellow-800 font-mono' : (isDecrypted ? 'font-medium' : '')}`}>
                            {message.content}
                          </p>
                        </div>
                        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          {!isOwn && <span>{message.author_username}</span>}
                          {!isOwn && <span>•</span>}
                          <span>{formatTime(message.timestamp)}</span>
                          {isGuest ? (
                            <>
                              <span>•</span>
                              <span className="text-yellow-600">Encrypted</span>
                            </>
                          ) : isDecrypted && !isOwn && (
                            <>
                              <span>•</span>
                              <span className="text-yellow-600">🔐 Decrypted</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Only show separate encrypted section for non-decrypted messages */}
        {currentChannel.is_encrypted && encryptedMessages?.length > 0 && currentUser && encryptedMessages.some(msg => !decryptedMessages?.[msg.id]) && (
          <div className="border-t border-yellow-200 pt-4 mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h3 className="text-sm font-medium text-yellow-800">Encrypted Messages</h3>
                <span className="text-xs text-yellow-600">({encryptedMessages.filter(msg => !decryptedMessages?.[msg.id]).length})</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {/* For undecrypted messages - sort oldest to newest to match regular messages */}
              {encryptedMessages
                .filter(msg => !decryptedMessages?.[msg.id])
                .sort((a, b) => Number(a.timestamp) - Number(b.timestamp))
                .map((encryptedMessage) => (
                  <EncryptedMessageDisplay 
                    key={encryptedMessage.id} 
                    encryptedMessage={encryptedMessage} 
                  />
              ))}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageDisplay;
