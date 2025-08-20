import React, { useState, useCallback } from 'react';
import { useChat } from '../hooks/ChatProvider.jsx';
import { useAuth } from '../hooks/Auth.jsx';
import { useTextArea } from '../hooks/TextArea.jsx';
import MessageDisplay from './MessageDisplay.jsx';
import PasswordModal from './PasswordModal.jsx';
import { MessageType } from '../lib/types.js';

const ChatRoom = () => {
  const [isEncryptedMode, setIsEncryptedMode] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // Track message being replied to
  const {
    textAreaValue,
    setTextAreaValue,
    textAreaRef,
    updateTextAreaHeight,
    clearTextArea
  } = useTextArea();
  const { 
    sendMessage, 
    sendEncryptedMessage, 
    currentChannel, 
    joinChannel
  } = useChat();
  const { isLoading, currentUser, isAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== START handleSendMessage ===');
    console.log('textAreaValue:', textAreaValue);
    console.log('isLoading:', isLoading);
    console.log('currentChannel:', currentChannel);
    console.log('isEncryptedMode:', isEncryptedMode);
    console.log('replyTo:', replyTo);
    
    if (textAreaValue.trim() && !isLoading) {
      console.log('Message is valid and not loading, proceeding...');
      
      // Send message based on channel type
      if (currentChannel.is_encrypted) {
        console.log('Channel is encrypted, sending encrypted message');
        try {
          console.log('Calling sendEncryptedMessage with:', {
            content: textAreaValue,
            channelId: currentChannel.id,
            replyToId: replyTo ? replyTo.id : [],
            messageType: 'Text',
            attachments: []
          });
          
          const result = await sendEncryptedMessage(
            textAreaValue, 
            currentChannel.id, 
            replyTo ? replyTo.id : [],
            { Text: null }, // MessageType.Text should be { Text: null }
            [] // Attachments
          );
          
          console.log('sendEncryptedMessage result:', result);
          
          if (result) {
            console.log('Encrypted message sent successfully');
            clearTextArea();
            setTextAreaValue('');
            setReplyTo(null);
          } else {
            console.log('Encrypted message failed (result was falsy)');
          }
        } catch (error) {
          console.error('Error sending encrypted message:', error);
          console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
          });
          
          // If NotAuthorized, try to join the channel first
          if (error.message && error.message.includes('NotAuthorized')) {
            console.log('NotAuthorized error detected, attempting to join channel first...');
            
            // Check if channel requires password
            if (currentChannel.password_hash) {
              console.log('Channel requires password, showing password modal');
              setShowPasswordModal(true);
              return;
            }
            
            console.log('Joining channel without password...');
            const joinResult = await joinChannel(currentChannel.id);
            console.log('joinChannel result:', joinResult);
            
            if (joinResult) {
              console.log('Successfully joined channel, retrying encrypted message...');
              // Retry sending the encrypted message
              const retryResult = await sendEncryptedMessage(
                textAreaValue,
                currentChannel.id,
                replyTo ? replyTo.id : [],
                { Text: null },
                [] // Attachments
              );
              
              console.log('Retry result:', retryResult);
              
              if (retryResult) {
                console.log('Encrypted message sent successfully after joining');
                clearTextArea();
                setTextAreaValue('');
                setReplyTo(null);
              } else {
                console.log('Encrypted message failed after joining');
              }
            } else {
              console.log('Failed to join channel');
            }
          }
        }
      } else {
        console.log('Sending regular message in regular channel');
        const result = await sendMessage(
          textAreaValue,
          { Text: null },
          [],
          replyTo ? [replyTo.id] : []
        );
        
        console.log('Regular message result:', result);
        
        if (result) {
          console.log('Regular message sent successfully');
          clearTextArea();
          setTextAreaValue('');
          setReplyTo(null);
        }
      }
    } else {
      console.log('Message invalid or loading - skipping send');
      console.log('textAreaValue trimmed:', textAreaValue.trim());
      console.log('textAreaValue empty?', textAreaValue.trim() === '');
    }
    
    console.log('=== END handleSendMessage ===');
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
<div className="w-full">
      {/* Message Input or Guest Prompt */}
      {currentUser ? (
<div className="flex-shrink-0 border-t border-gray-200 bg-white px-3 sm:px-4 py-2 sm:py-3 sticky bottom-0 z-10 shadow-lg">
<form onSubmit={handleSubmit} className="flex-1 flex items-end space-x-2 sm:space-x-3">
            <div className="flex-1 min-w-0">
              <textarea
                ref={textAreaRef}
                value={textAreaValue}
                onChange={(e) => {
                  setTextAreaValue(e.target.value);
                  updateTextAreaHeight();
                }}
                onKeyPress={handleKeyPress}
placeholder={(isEncryptedMode || currentChannel.is_encrypted) ? '🔒 Encrypted message...' : 'Message...'}
                rows="1"
className={`w-full resize-none border rounded-lg px-3 sm:px-4 py-2 focus:ring-2 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 ${
                  (isEncryptedMode || currentChannel.is_encrypted) 
                    ? 'border-yellow-300 focus:ring-yellow-500 bg-yellow-50' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                disabled={isLoading}
style={{ minHeight: '50px', maxHeight: '120px' }}
              />
            </div>
              <button
                type="submit"
                disabled={!textAreaValue.trim() || isLoading}
className={`inline-flex items-center px-3 sm:px-4 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                (isEncryptedMode || currentChannel.is_encrypted)
                  ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  {(isEncryptedMode || currentChannel.is_encrypted) && (
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </>
              )}
              {(isEncryptedMode || currentChannel.is_encrypted) ? 'Send Encrypted' : 'Send'}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900">Join the Conversation!</h3>
                <p className="text-sm text-blue-700">
                  You're viewing Chat Z as a guest. Login to send messages and participate in encrypted channels.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal
          channelName={currentChannel.name}
          onSubmit={async (password) => {
            setShowPasswordModal(false);
            const success = await joinChannel(currentChannel.id, password);
            if (success) {
              // Retry sending the message
              if (currentChannel.is_encrypted) {
                const retryResult = await sendEncryptedMessage(
                  textAreaValue,
                  currentChannel.id,
                  replyTo ? replyTo.id : null,
                  MessageType.Text,
                  [] // Attachments
                );
                if (retryResult) {
                  clearTextArea();
                  setTextAreaValue('');
                  setReplyTo(null);
                }
              } else {
                const retryResult = await sendMessage(
                  textAreaValue,
                  { Text: null },
                  [],
                  replyTo ? [replyTo.id] : []
                );
                if (retryResult) {
                  clearTextArea();
                  setTextAreaValue('');
                  setReplyTo(null);
                }
              }
            }
          }}
          onCancel={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export default ChatRoom;
