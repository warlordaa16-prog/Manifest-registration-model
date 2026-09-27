import React, { useState } from 'react';
import {
  FormCreationConfig,
  FormItemQuestion,
  DEFAULT_STUDENT_FORM_CONFIG,
  GoogleFormDetails
} from '../services/googleForms';
import {
  FileText,
  User,
  GraduationCap,
  Calendar,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  Copy,
  QrCode,
  AlertCircle,
  HelpCircle,
  Check,
  ChevronDown,
  Layers
} from 'lucide-react';

interface FormBuilderProps {
  onFormCreated: (form: GoogleFormDetails) => void;
  isCreating: boolean;
  createError: string | null;
  onSubmitCreate: (config: FormCreationConfig) => Promise<void>;
  existingActiveForm: GoogleFormDetails | null;
  onOpenExistingForm: () => void;
}

export const FormBuilder: React.FC<FormBuilderProps> = ({
  onFormCreated,
  isCreating,
  createError,
  onSubmitCreate,
  existingActiveForm,
  onOpenExistingForm,
}) => {
  const [config, setConfig] = useState<FormCreationConfig>(() => ({
    ...DEFAULT_STUDENT_FORM_CONFIG,
    questions: JSON.parse(JSON.stringify(DEFAULT_STUDENT_FORM_CONFIG.questions))
  }));

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [customOptionInputs, setCustomOptionInputs] = useState<Record<number, string>>({});

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig((prev) => ({ ...prev, title: e.target.value }));
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleQuestionTitleChange = (index: number, val: string) => {
    setConfig((prev) => {
      const q = [...prev.questions];
      q[index].title = val;
      return { ...prev, questions: q };
    });
  };

  const handleQuestionDescChange = (index: number, val: string) => {
    setConfig((prev) => {
      const q = [...prev.questions];
      q[index].description = val;
      return { ...prev, questions: q };
    });
  };

  const handleQuestionRequiredToggle = (index: number) => {
    setConfig((prev) => {
      const q = [...prev.questions];
      q[index].required = !q[index].required;
      return { ...prev, questions: q };
    });
  };

  const handleQuestionTypeChange = (index: number, type: FormItemQuestion['type']) => {
    setConfig((prev) => {
      const q = [...prev.questions];
      q[index].type = type;
      if ((type === 'RADIO' || type === 'DROP_DOWN' || type === 'CHECKBOX') && (!q[index].options || q[index].options!.length === 0)) {
        q[index].options = ['Option 1', 'Option 2'];
      }
      return { ...prev, questions: q };
    });
  };

  const handleAddOption = (questionIndex: number) => {
    const text = customOptionInputs[questionIndex]?.trim();
    if (!text) return;
    setConfig((prev) => {
      const q = [...prev.questions];
      const currentOpts = q[questionIndex].options || [];
      q[questionIndex].options = [...currentOpts, text];
      return { ...prev, questions: q };
    });
    setCustomOptionInputs((prev) => ({ ...prev, [questionIndex]: '' }));
  };

  const handleRemoveOption = (questionIndex: number, optIndex: number) => {
    setConfig((prev) => {
      const q = [...prev.questions];
      const currentOpts = [...(q[questionIndex].options || [])];
      currentOpts.splice(optIndex, 1);
      q[questionIndex].options = currentOpts;
      return { ...prev, questions: q };
    });
  };

  const handleRemoveQuestion = (index: number) => {
    if (config.questions.length <= 1) return;
    setConfig((prev) => {
      const q = [...prev.questions];
      q.splice(index, 1);
      return { ...prev, questions: q };
    });
  };

  const handleAddCustomQuestion = () => {
    const newQ: FormItemQuestion = {
      title: 'Additional Field (e.g. Student ID or Phone)',
      description: 'Enter additional registration information',
      type: 'TEXT',
      required: false,
    };
    setConfig((prev) => ({
      ...prev,
      questions: [...prev.questions, newQ],
    }));
  };

  const handleResetToStandard = () => {
    setConfig(JSON.parse(JSON.stringify(DEFAULT_STUDENT_FORM_CONFIG)));
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Helper icon for each field
  const getFieldIcon = (index: number, title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('name') || lower.includes('person')) {
      return <User className="w-5 h-5 text-purple-600" />;
    }
    if (lower.includes('course') || lower.includes('program')) {
      return <GraduationCap className="w-5 h-5 text-blue-600" />;
    }
    if (lower.includes('year') || lower.includes('study') || lower.includes('stage')) {
      return <Calendar className="w-5 h-5 text-emerald-600" />;
    }
    if (lower.includes('department') || lower.includes('faculty')) {
      return <Building2 className="w-5 h-5 text-amber-600" />;
    }
    return <FileText className="w-5 h-5 text-indigo-600" />;
  };

  return (
    <div className="space-y-8">
      {/* If a form was recently created, show the Active Form Banner */}
      {existingActiveForm && (
        <div className="bg-linear-to-r from-purple-50 via-indigo-50 to-purple-50 border border-purple-200 rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Form Live on Google Drive
                </span>
                <span className="text-xs text-gray-500 font-mono">
                  ID: {existingActiveForm.formId.slice(0, 14)}...
                </span>
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                {existingActiveForm.info.title}
              </h2>
              <p className="text-xs text-gray-600 max-w-2xl">
                Ready for students! Share the responder link or QR code below to start collecting registrations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {existingActiveForm.responderUri && (
                <>
                  <a
                    href={existingActiveForm.responderUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    <span>Open Student Form</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleCopyLink(existingActiveForm.responderUri!)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-medium">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowQrModal(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors cursor-pointer"
                    title="Display QR code for posters or slides"
                  >
                    <QrCode className="w-3.5 h-3.5 text-purple-600" />
                    <span>QR Code</span>
                  </button>
                </>
              )}

              <a
                href={`https://docs.google.com/forms/d/${existingActiveForm.formId}/edit`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 bg-transparent hover:bg-gray-100 rounded-xl transition-colors"
                title="Edit questions in official Google Forms editor"
              >
                <span>Edit on Google</span>
                <ExternalLink className="w-3 h-3 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form Setup on Left, Live Google Form Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Builder Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Configure Google Form Fields
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Pre-configured with all 4 required fields for student registration.
                </p>
              </div>
              <button
                type="button"
                onClick={handleResetToStandard}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium hover:underline"
              >
                Reset to standard
              </button>
            </div>

            {/* Form Title & Description */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Google Form Title
                </label>
                <input
                  type="text"
                  value={config.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. Student Registration Form 2026"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  value={config.description}
                  onChange={handleDescChange}
                  placeholder="Provide instructions for students filling out the form..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                  Form Questions ({config.questions.length})
                </span>
                <span className="text-[11px] text-gray-400">
                  Ordered as will appear on Google Forms
                </span>
              </div>

              <div className="space-y-3">
                {config.questions.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    className="p-4 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-gray-50 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-white shadow-xs border border-gray-100">
                          {getFieldIcon(qIndex, q.title)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-700">
                              Question {qIndex + 1}
                            </span>
                            {q.required ? (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                                Required *
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                Optional
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Type Selector */}
                        <select
                          value={q.type}
                          onChange={(e) => handleQuestionTypeChange(qIndex, e.target.value as any)}
                          className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1 text-gray-700 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                        >
                          <option value="TEXT">Short Answer (Text)</option>
                          <option value="RADIO">Multiple Choice (Radio)</option>
                          <option value="DROP_DOWN">Dropdown Menu</option>
                          <option value="PARAGRAPH">Paragraph (Long text)</option>
                        </select>

                        {/* Required Toggle */}
                        <button
                          type="button"
                          onClick={() => handleQuestionRequiredToggle(qIndex)}
                          title="Toggle required status"
                          className={`text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                            q.required
                              ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {q.required ? 'Req' : 'Opt'}
                        </button>

                        {/* Remove question (if extra) */}
                        {config.questions.length > 4 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIndex)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete this question"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question Title & Hint Input */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={q.title}
                        onChange={(e) => handleQuestionTitleChange(qIndex, e.target.value)}
                        placeholder="Field Title (e.g. Full Name)"
                        className="w-full text-xs font-medium px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        value={q.description || ''}
                        onChange={(e) => handleQuestionDescChange(qIndex, e.target.value)}
                        placeholder="Helper description / guidance"
                        className="w-full text-xs text-gray-600 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    {/* Options list if RADIO or DROP_DOWN */}
                    {(q.type === 'RADIO' || q.type === 'DROP_DOWN') && (
                      <div className="mt-2 pt-2 border-t border-gray-200/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>Choices for students ({q.options?.length || 0}):</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-gray-200">
                          {q.options?.map((opt, optIdx) => (
                            <span
                              key={optIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-purple-50 text-purple-900 border border-purple-200"
                            >
                              <span>{opt}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIndex, optIdx)}
                                className="text-purple-400 hover:text-purple-800 text-[10px]"
                              >
                                &times;
                              </button>
                            </span>
                          ))}
                        </div>

                        {/* Add Choice */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customOptionInputs[qIndex] || ''}
                            onChange={(e) =>
                              setCustomOptionInputs((prev) => ({
                                ...prev,
                                [qIndex]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddOption(qIndex);
                              }
                            }}
                            placeholder="Add another option..."
                            className="flex-1 text-xs px-2.5 py-1 bg-white border border-gray-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIndex)}
                            className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add custom question button */}
              <button
                type="button"
                onClick={handleAddCustomQuestion}
                className="w-full py-2.5 border-2 border-dashed border-gray-300 hover:border-purple-400 rounded-xl text-xs font-semibold text-gray-600 hover:text-purple-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Additional Question (e.g. Student ID, Phone, Email)</span>
              </button>
            </div>

            {/* Error Message */}
            {createError && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Creation Error</p>
                  <p>{createError}</p>
                </div>
              </div>
            )}

            {/* Action Trigger */}
            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Creates a real Google Form in your Google Drive with the 4 specified fields.
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={isCreating}
                className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isCreating ? 'Creating Google Form...' : 'Create Google Form'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Form Interactive Visual Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2 flex items-center justify-between">
              <span>Student Responder View Preview</span>
              <span className="text-[11px] text-purple-600 font-normal">Authentic Google Form UI</span>
            </div>

            {/* Google Forms Authentic Mock Box */}
            <div className="bg-[#f0ebf8] p-3 sm:p-4 rounded-2xl border border-purple-100 shadow-sm space-y-3 font-sans">
              {/* Form Header Card */}
              <div className="bg-white rounded-xl overflow-hidden shadow-xs border-t-8 border-purple-700 border-x border-b border-gray-200">
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 leading-snug">
                    {config.title || 'Untitled Form'}
                  </h3>
                  <p className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                    {config.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-red-600">
                    <span>* Indicates required question</span>
                  </div>
                </div>
              </div>

              {/* Questions Preview Cards */}
              {config.questions.map((q, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-4 shadow-xs border border-gray-200 space-y-2.5 transition-all"
                >
                  <div className="flex items-start gap-1">
                    <span className="text-xs font-medium text-gray-900">
                      {q.title || `Question ${idx + 1}`}
                    </span>
                    {q.required && <span className="text-red-500 font-bold">*</span>}
                  </div>
                  {q.description && (
                    <p className="text-[11px] text-gray-500 leading-normal">{q.description}</p>
                  )}

                  {/* Render input representation */}
                  {q.type === 'TEXT' && (
                    <div className="pt-1">
                      <div className="w-3/4 border-b border-gray-300 pb-1 text-xs text-gray-400">
                        Your answer
                      </div>
                    </div>
                  )}

                  {q.type === 'PARAGRAPH' && (
                    <div className="pt-1">
                      <div className="w-full border-b border-gray-300 pb-4 text-xs text-gray-400">
                        Your answer
                      </div>
                    </div>
                  )}

                  {q.type === 'RADIO' && (
                    <div className="space-y-1.5 pt-1">
                      {q.options?.map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`preview_radio_${idx}`}
                            disabled
                            className="text-purple-600 focus:ring-purple-500 h-3.5 w-3.5"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {q.type === 'DROP_DOWN' && (
                    <div className="pt-1">
                      <div className="w-full sm:w-2/3 border border-gray-300 rounded-lg px-3 py-1.5 text-xs text-gray-500 flex items-center justify-between bg-gray-50">
                        <span>Choose department...</span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Submit Button representation */}
              <div className="flex justify-between items-center px-1 pt-1">
                <button
                  disabled
                  className="px-5 py-1.5 bg-purple-600 text-white font-medium text-xs rounded-md shadow-xs opacity-80 cursor-not-allowed"
                >
                  Submit
                </button>
                <span className="text-[10px] text-gray-400">Google Forms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explicit User Confirmation Modal (MANDATORY for Workspace Operations) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Create Google Form?
                </h3>
                <p className="text-xs text-gray-500">
                  Confirmation required to create file in your Google Drive
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3.5 text-xs text-gray-700 space-y-2 border border-gray-200">
              <p className="font-semibold text-gray-900">
                The following form will be created under your Google account:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-gray-600">
                <li>
                  <strong className="text-gray-800">Form Title:</strong> {config.title}
                </li>
                <li>
                  <strong className="text-gray-800">Fields ({config.questions.length}):</strong>{' '}
                  {config.questions.map((q) => q.title).join(', ')}
                </li>
                <li>
                  <strong className="text-gray-800">Location:</strong> Stored directly in your Google Drive
                </li>
              </ul>
              <p className="text-[11px] text-purple-800 pt-1">
                You will be able to share the public link with students and view submitted registrations in real-time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowConfirmModal(false);
                  await onSubmitCreate(config);
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs cursor-pointer"
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal for In-Person or Classroom Registrations */}
      {showQrModal && existingActiveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 text-center space-y-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Scan to Register
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Display this on slides, print for an orientation desk, or share with students
              </p>
            </div>

            <div className="p-4 bg-white border border-gray-200 rounded-2xl inline-block shadow-xs">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  existingActiveForm.responderUri || ''
                )}`}
                alt="Form QR Code"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-xl font-mono truncate">
              {existingActiveForm.responderUri}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => handleCopyLink(existingActiveForm.responderUri || '')}
                className="px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-colors cursor-pointer"
              >
                {copiedLink ? 'Copied Link!' : 'Copy Form Link'}
              </button>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
