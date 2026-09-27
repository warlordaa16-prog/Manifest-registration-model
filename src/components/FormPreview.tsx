import React, { useState } from 'react';
import { GoogleFormDetails } from '../services/googleForms';
import { ExternalLink, Copy, Check, QrCode, Sparkles, Smartphone, Monitor } from 'lucide-react';

interface FormPreviewProps {
  form: GoogleFormDetails | null;
  onGoToBuilder: () => void;
}

export const FormPreview: React.FC<FormPreviewProps> = ({ form, onGoToBuilder }) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  if (!form || !form.responderUri) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
        <h3 className="text-base font-bold text-gray-900">
          No Form to Display Yet
        </h3>
        <p className="text-xs text-gray-500">
          Create your registration form using the builder to view the live Google Form responder view.
        </p>
        <button
          onClick={onGoToBuilder}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors cursor-pointer"
        >
          Open Form Builder
        </button>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(form.responderUri || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Google Forms responder URL can have `?embedded=true` appended for clean embedding
  const embeddedUrl = form.responderUri.includes('?')
    ? `${form.responderUri}&embedded=true`
    : `${form.responderUri}?embedded=true`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {form.info.title}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Live interactive Google Form ready for student registrations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="hidden sm:flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'desktop' ? 'bg-white shadow-xs text-purple-700' : 'text-gray-500'
              }`}
              title="Desktop width"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'mobile' ? 'bg-white shadow-xs text-purple-700' : 'text-gray-500'
              }`}
              title="Mobile phone width"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy Shareable Link</span>
              </>
            )}
          </button>

          <a
            href={form.responderUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <span>Open in New Tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex justify-center">
        <div
          className={`w-full transition-all duration-300 ${
            viewMode === 'mobile' ? 'max-w-md' : 'max-w-4xl'
          }`}
        >
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-md">
            <div className="bg-purple-700 p-3 px-4 text-white flex items-center justify-between text-xs">
              <span className="font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-200" />
                Google Forms Live Responder Frame
              </span>
              <span className="text-purple-200 text-[11px]">
                Official Google Interface
              </span>
            </div>

            <iframe
              src={embeddedUrl}
              width="100%"
              height="750"
              frameBorder="0"
              marginHeight={0}
              marginWidth={0}
              className="w-full bg-gray-50"
              title="Google Form Responder Preview"
            >
              Loading…
            </iframe>
          </div>
        </div>
      </div>
    </div>
  );
};
