const Header = ({ user, onLogout, onProfileClick, onLogin }) => {
  return (
    <header className="bg-white shadow-md border-b border-gray-200 h-16">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center space-x-3 lg:space-x-4">
            <div className="h-8 w-8 lg:h-9 lg:w-9 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-sm">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 tracking-tight">Chat Z</h1>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-4">
            {user ? (
              <>
                <button
                  onClick={onProfileClick}
                  className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
                >
                  <div className="h-8 w-8 lg:h-9 lg:w-9 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <span className="text-white font-medium text-sm">
                      {user.username ? user.username[0].toUpperCase() : '?'}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {user.username || 'Unknown User'}
                  </span>
                </button>

                <button
                  onClick={onLogout}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  <span className="hidden sm:inline">Logout</span>
                  <span className="sm:hidden">🚪</span>
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100">
                    <span className="text-gray-500">👤</span>
                  </div>
                  <span className="hidden sm:inline">Guest Mode</span>
                </div>

                <button
                  onClick={onLogin}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
                >
                  <span className="hidden sm:inline">Login</span>
                  <span className="sm:hidden">👤</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
