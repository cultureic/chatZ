import React, { useState } from 'react';

const PasswordModal = ({ channelName, onSubmit, onCancel, needsPassword }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Password modal submit');
    console.log('Needs password:', needsPassword);
    console.log('Password value:', password || 'none');

    try {
      if (needsPassword) {
        console.log('Submitting with password');
        onSubmit(password);
      } else {
        console.log('Submitting without password');
        onSubmit(null);
      }
      setPassword('');
    } catch (error) {
      console.error('Error in password modal submit:', error);
    }
  };

  return (
    <>
      {/* Modal backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 z-[9999]"
        onClick={() => onCancel()}
        aria-hidden="true"
      />
      
      {/* Modal container */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto">
        <div className="relative min-h-full w-full flex items-center justify-center p-4">
          
          {/* Modal content */}
          <div 
            className="relative w-full max-w-md bg-white rounded-xl shadow-2xl transform transition-all"
            onClick={e => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="absolute right-4 top-4">
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500 transition-colors duration-200 focus:outline-none"
                onClick={onCancel}
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {needsPassword ? (
                    <div className="p-3 bg-yellow-100 rounded-full">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-100 rounded-full">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {needsPassword ? '🔒 Enter Password' : 'Join Channel'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {needsPassword 
                      ? `Enter password to join #${channelName}`
                      : `Would you like to join #${channelName}?`
                    }
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6">
                {needsPassword && (
                  <div className="mb-4">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter channel password"
                      autoFocus
                    />
                  </div>
                )}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <button
                    type="button"
                    onClick={onCancel}
                    className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 sm:mb-0 sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={needsPassword && !password.trim()}
                    className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                  >
                    Join Channel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PasswordModal;
