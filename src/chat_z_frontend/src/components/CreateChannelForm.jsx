import { useState, useRef, useEffect } from 'react';
import paymentService from '../services/paymentService.js';

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (channelName.trim()) {
      // If creating an encrypted channel, trigger payment modal first
      if (isEncrypted) {
        setIsProcessingPayment(true);
        try {
          console.log('🔒 Creating encrypted channel - opening payment modal...');
          
          // Open payment modal for product_1 (encrypted channel access)
          const paymentResult = await paymentService.openPasswordChannelPayment();
          
          console.log('💰 Payment successful:', paymentResult);
          
          // After successful payment, create the encrypted channel
          onCreateChannel({
            name: channelName.trim(),
            description: channelDescription.trim() || null,
            isEncrypted,
            password: password.trim() || null,
            paymentTransactionId: paymentResult.transactionId // Include transaction ID
          });
          
          // Clear form
          setChannelName('');
          setChannelDescription('');
          setIsEncrypted(false);
          setPassword('');
          
          onDismiss();
        } catch (error) {
          console.error('❌ Payment failed or cancelled:', error);
          
          // Show user-friendly error message
          const errorMessage = error.message === 'Payment failed' 
            ? 'Payment is required to create encrypted channels. Please complete the payment to continue.'
            : 'Payment was cancelled or failed. Please try again.';
            
          alert(errorMessage);
        } finally {
          setIsProcessingPayment(false);
        }
      } else {
        // Regular channel creation (no payment required)
        onCreateChannel({
          name: channelName.trim(),
          description: channelDescription.trim() || null,
          isEncrypted: false,
          password: null,
        });
        
        // Clear form
        setChannelName('');
        setChannelDescription('');
        setIsEncrypted(false);
        setPassword('');
        
        onDismiss();
      }
    }
  };

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
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-yellow-400 mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Payment Required</p>
                  <p className="mt-1">Encrypted channels require payment via ckPay. You'll be redirected to complete payment before the channel is created.</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          type="submit"
          disabled={isProcessingPayment}
          className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            isEncrypted 
              ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
          }`}
        >
          {isProcessingPayment ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Payment...
            </>
          ) : (
            <>
              {isEncrypted && (
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
              {isEncrypted ? '🔒 Create Encrypted Channel' : 'Create Channel'}
            </>
          )}
        </button>
      </form>
    </div>
    </div>
  );
};

export default CreateChannelForm;

