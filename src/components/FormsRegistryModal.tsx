import React, { useState } from 'react';
import { GoogleFormDetails, getGoogleForm, listAppForms } from '../services/googleForms';
import { FolderGit2, Search, ExternalLink, Check, Plus, Loader2 } from 'lucide-react';

interface FormsRegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  savedForms: GoogleFormDetails[];
  onSelectForm: (form: GoogleFormDetails) => void;
  currentFormId?: string;
}

export const FormsRegistryModal: React.FC<FormsRegistryModalProps> = ({
  isOpen,
  onClose,
  token,
  savedForms,
  onSelectForm,
  currentFormId,
}) => {
  const [customFormIdInput, setCustomFormIdInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [driveForms, setDriveForms] = useState<Array<{ id: string; name: string; modifiedTime: string }>>([]);
  const [hasSearchedDrive, setHasSearchedDrive] = useState(false);

  if (!isOpen) return null;

  const handleLookupCustom = async () => {
    if (!customFormIdInput.trim() || !token) return;
    setIsSearching(true);
    setLookupError(null);

    // Extract formId if full URL was pasted
    let formId = customFormIdInput.trim();
    if (formId.includes('/forms/d/')) {
      const match = formId.match(/\/forms\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        formId = match[1];
      }
    }

    try {
      const form = await getGoogleForm(token, formId);
      onSelectForm(form);
      onClose();
    } catch (err: any) {
      console.error('Form lookup error:', err);
      setLookupError(err.message || 'Form not found or inaccessible.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchDrive = async () => {
    if (!token) return;
    setIsSearching(true);
    setLookupError(null);
    try {
      const files = await listAppForms(token);
      setDriveForms(files);
      setHasSearchedDrive(true);
    } catch (err: any) {
      console.error('Drive query error:', err);
      setLookupError('Could not query Drive files.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDriveFile = async (fileId: string) => {
    if (!token) return;
    setIsSearching(true);
    try {
      const form = await getGoogleForm(token, fileId);
      onSelectForm(form);
      onClose();
    } catch (err: any) {
      setLookupError(`Could not load form: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Registration Forms History
            </h3>
            <p className="text-xs text-gray-500">
              Switch between registration forms or load a form by ID
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Saved forms in this session / local storage */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
            Recently Created Forms
          </span>

          {savedForms.length === 0 ? (
            <div className="p-4 bg-gray-50 rounded-xl text-center text-xs text-gray-500">
              No forms created yet in this browser session.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {savedForms.map((f) => {
                const isCurrent = f.formId === currentFormId;
                return (
                  <div
                    key={f.formId}
                    onClick={() => {
                      onSelectForm(f);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isCurrent
                        ? 'border-purple-300 bg-purple-50/60'
                        : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {f.info.title}
                      </p>
                      <p className="text-[11px] text-gray-500 font-mono">
                        ID: {f.formId.slice(0, 16)}...
                      </p>
                    </div>

                    {isCurrent && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-200 text-purple-800">
                        Selected
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Load by Form ID or URL */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
            Open by Form ID or URL
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              value={customFormIdInput}
              onChange={(e) => setCustomFormIdInput(e.target.value)}
              placeholder="Paste Form ID or Google Form URL..."
              className="flex-1 text-xs px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-500 focus:bg-white"
            />
            <button
              onClick={handleLookupCustom}
              disabled={isSearching || !customFormIdInput.trim()}
              className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-medium transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Load'}
            </button>
          </div>
        </div>

        {/* Drive files finder */}
        <div className="pt-2 border-t border-gray-100">
          {!hasSearchedDrive ? (
            <button
              onClick={handleSearchDrive}
              disabled={isSearching}
              className="w-full py-2 text-xs font-medium text-gray-700 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 rounded-xl transition-colors border border-gray-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search My Google Drive for App Forms</span>
            </button>
          ) : (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-700">
                Found on Google Drive ({driveForms.length})
              </span>
              {driveForms.length === 0 ? (
                <p className="text-xs text-gray-500">No other forms found in Drive for this app.</p>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {driveForms.map((df) => (
                    <button
                      key={df.id}
                      onClick={() => handleSelectDriveFile(df.id)}
                      className="w-full text-left p-2 rounded-lg text-xs hover:bg-purple-50 hover:text-purple-900 border border-transparent hover:border-purple-200 transition-colors flex items-center justify-between"
                    >
                      <span className="truncate font-medium">{df.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {new Date(df.modifiedTime).toLocaleDateString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {lookupError && (
          <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs">
            {lookupError}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
