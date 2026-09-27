/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  SCOPES
} from './services/auth';
import {
  GoogleFormDetails,
  createGoogleForm,
  FormCreationConfig,
  getFormResponses
} from './services/googleForms';
import { Navbar } from './components/Navbar';
import { FormBuilder } from './components/FormBuilder';
import { SubmissionsDashboard } from './components/SubmissionsDashboard';
import { FormPreview } from './components/FormPreview';
import { FormsRegistryModal } from './components/FormsRegistryModal';
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Share2,
  TableProperties,
  ArrowRight,
  ExternalLink,
  History
} from 'lucide-react';

const LOCAL_STORAGE_FORMS_KEY = 'student_hub_google_forms_history';
const LOCAL_STORAGE_ACTIVE_FORM_KEY = 'student_hub_active_form_id';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'builder' | 'dashboard' | 'preview'>('builder');

  const [activeForm, setActiveForm] = useState<GoogleFormDetails | null>(null);
  const [savedForms, setSavedForms] = useState<GoogleFormDetails[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_FORMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [isCreatingForm, setIsCreatingForm] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [totalSubmissions, setTotalSubmissions] = useState<number | undefined>(undefined);
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [creationSuccessNotice, setCreationSuccessNotice] = useState<string | null>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Restore active form from saved list on first load
  useEffect(() => {
    if (savedForms.length > 0 && !activeForm) {
      const savedActiveId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_FORM_KEY);
      const matched = savedForms.find((f) => f.formId === savedActiveId) || savedForms[0];
      setActiveForm(matched);
    }
  }, [savedForms]);

  // Fetch count of submissions for badge
  useEffect(() => {
    if (token && activeForm) {
      getFormResponses(token, activeForm.formId)
        .then((responses) => {
          setTotalSubmissions(responses.length);
        })
        .catch(() => {
          // ignore badge error
        });
    } else {
      setTotalSubmissions(undefined);
    }
  }, [token, activeForm?.formId]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
  };

  const handleCreateForm = async (config: FormCreationConfig) => {
    if (!token) {
      await handleLogin();
      return;
    }

    setIsCreatingForm(true);
    setCreateError(null);
    setCreationSuccessNotice(null);

    try {
      const newForm = await createGoogleForm(token, config);
      setActiveForm(newForm);

      // Update saved forms list
      setSavedForms((prev) => {
        const filtered = prev.filter((f) => f.formId !== newForm.formId);
        const updated = [newForm, ...filtered];
        try {
          localStorage.setItem(LOCAL_STORAGE_FORMS_KEY, JSON.stringify(updated));
          localStorage.setItem(LOCAL_STORAGE_ACTIVE_FORM_KEY, newForm.formId);
        } catch (e) {
          console.error('Failed to write to local storage', e);
        }
        return updated;
      });

      setCreationSuccessNotice(
        `"${newForm.info.title}" has been created successfully in your Google Drive!`
      );
      setTimeout(() => setCreationSuccessNotice(null), 6000);
    } catch (err: any) {
      console.error('Failed to create form:', err);
      setCreateError(err.message || 'Failed to create Google Form');
    } finally {
      setIsCreatingForm(false);
    }
  };

  const handleSelectForm = (form: GoogleFormDetails) => {
    setActiveForm(form);
    try {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_FORM_KEY, form.formId);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      {/* Navigation */}
      <Navbar
        user={user}
        hasToken={!!token}
        isLoggingIn={isLoggingIn}
        onLogin={handleLogin}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeFormTitle={activeForm?.info.title}
        totalSubmissions={totalSubmissions}
        onNewFormClick={() => {
          setActiveTab('builder');
        }}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Success toast notification */}
        {creationSuccessNotice && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between shadow-xs animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold">{creationSuccessNotice}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
              >
                View Submissions Dashboard &rarr;
              </button>
            </div>
          </div>
        )}

        {/* If user is not authenticated with Google, show onboarding hero */}
        {!token ? (
          <div className="max-w-4xl mx-auto py-10 space-y-12">
            {/* Hero Card */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 sm:p-12 text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Google Forms Official Integration</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Create Your Student Registration Google Form
              </h1>

              <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Automatically generate and publish an official Google Form tailored for registration with all 4 required fields:
                <strong className="text-gray-900 font-semibold"> Name of Person</strong>,
                <strong className="text-gray-900 font-semibold"> Course</strong>,
                <strong className="text-gray-900 font-semibold"> Year of Study</strong>, and
                <strong className="text-gray-900 font-semibold"> Department</strong>.
              </p>

              {/* Official Sign In Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={handleLogin}
                  disabled={isLoggingIn}
                  className="px-6 py-3.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm transition-all flex items-center gap-3 cursor-pointer group disabled:opacity-60"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
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
                  <span className="text-sm font-semibold text-gray-800">
                    {isLoggingIn ? 'Connecting to Google Forms...' : 'Sign in with Google to Begin'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Scope assurance */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Authorized via official Google Workspace Forms & Drive API</span>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  1-Click Form Creation
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Creates an authentic Google Form directly inside your personal Google Drive, instantly ready to receive submissions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Instant Link & QR Code
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Share the responder URL with students or project the instant QR code in auditoriums, registration desks, or slides.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <TableProperties className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Live Submissions & CSV Export
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Filter students by department and year of study, analyze real-time admission numbers, and export full records to CSV.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* User is authenticated: Render tabs */
          <div className="space-y-6">
            {/* Top secondary control bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {savedForms.length > 0 && (
                  <button
                    onClick={() => setShowRegistryModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors cursor-pointer shadow-xs"
                    title="Switch active registration form"
                  >
                    <History className="w-3.5 h-3.5 text-purple-600" />
                    <span>My Forms ({savedForms.length})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Target Fields: Name • Course • Year • Department
                </span>
              </div>
            </div>

            {/* Tab: Form Builder */}
            {activeTab === 'builder' && (
              <FormBuilder
                onFormCreated={(form) => {
                  setActiveForm(form);
                  setActiveTab('dashboard');
                }}
                isCreating={isCreatingForm}
                createError={createError}
                onSubmitCreate={handleCreateForm}
                existingActiveForm={activeForm}
                onOpenExistingForm={() => setActiveTab('dashboard')}
              />
            )}

            {/* Tab: Submissions & Live Analytics */}
            {activeTab === 'dashboard' && (
              <SubmissionsDashboard
                token={token}
                formDetails={activeForm}
                onOpenForm={() => setActiveTab('builder')}
              />
            )}

            {/* Tab: Live Form Responder Preview */}
            {activeTab === 'preview' && (
              <FormPreview
                form={activeForm}
                onGoToBuilder={() => setActiveTab('builder')}
              />
            )}
          </div>
        )}
      </main>

      {/* Forms Registry / History Modal */}
      <FormsRegistryModal
        isOpen={showRegistryModal}
        onClose={() => setShowRegistryModal(false)}
        token={token}
        savedForms={savedForms}
        onSelectForm={handleSelectForm}
        currentFormId={activeForm?.formId}
      />
    </div>
  );
}
