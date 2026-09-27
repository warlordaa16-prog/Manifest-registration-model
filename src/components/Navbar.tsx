import React from 'react';
import { User } from 'firebase/auth';
import { LogOut, ExternalLink, FileSpreadsheet, PlusCircle, CheckCircle2, RefreshCw } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  hasToken: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  activeTab: 'builder' | 'dashboard' | 'preview';
  setActiveTab: (tab: 'builder' | 'dashboard' | 'preview') => void;
  activeFormTitle?: string;
  totalSubmissions?: number;
  onNewFormClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  hasToken,
  isLoggingIn,
  onLogin,
  onLogout,
  activeTab,
  setActiveTab,
  activeFormTitle,
  totalSubmissions,
  onNewFormClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center shadow-sm text-white font-bold">
              {/* Google Forms Iconic Violet Form Symbol */}
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 tracking-tight text-lg">
                  Student Registration Form Hub
                </span>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                  Google Forms
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block">
                Name • Course • Year of Study • Department
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          {hasToken && (
            <div className="hidden md:flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('builder')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'builder'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Form Builder & Share
              </button>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>Live Registrations</span>
                {totalSubmissions !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    activeTab === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {totalSubmissions}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Form View
              </button>
            </div>
          )}

          {/* Right Area: User Status or Official Sign-In */}
          <div className="flex items-center gap-3">
            {hasToken && (
              <button
                onClick={onNewFormClick}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors border border-purple-200"
                title="Create another registration form"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Form</span>
              </button>
            )}

            {user && hasToken ? (
              <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
                <div className="flex items-center gap-2 text-right">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full border border-gray-300 shadow-xs object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-medium text-xs">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {user.displayName || 'Authorized User'}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight truncate max-w-[140px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Disconnect Google Account"
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* Official "Sign in with Google" Button Styling */
              <div className="flex items-center gap-2">
                <button
                  onClick={onLogin}
                  className="relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-1 focus:ring-purple-500 shadow-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation */}
        {hasToken && (
          <div className="flex md:hidden border-t border-gray-200 py-2 space-x-1">
            <button
              onClick={() => setActiveTab('builder')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'builder' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'
              }`}
            >
              Form Builder
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'dashboard' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'
              }`}
            >
              Registrations ({totalSubmissions ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'preview' ? 'bg-purple-100 text-purple-700' : 'text-gray-600'
              }`}
            >
              Form Preview
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
