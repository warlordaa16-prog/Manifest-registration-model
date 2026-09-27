import React, { useState, useEffect, useMemo } from 'react';
import {
  GoogleFormDetails,
  ParsedStudentRegistration,
  getFormResponses,
  parseRegistrations,
  GoogleFormSubmission
} from '../services/googleForms';
import {
  RefreshCw,
  Download,
  Search,
  Filter,
  Users,
  Building2,
  GraduationCap,
  Calendar,
  ExternalLink,
  ChevronRight,
  Eye,
  CheckCircle,
  Clock,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

interface SubmissionsDashboardProps {
  token: string | null;
  formDetails: GoogleFormDetails | null;
  onOpenForm: () => void;
}

export const SubmissionsDashboard: React.FC<SubmissionsDashboardProps> = ({
  token,
  formDetails,
  onOpenForm,
}) => {
  const [submissions, setSubmissions] = useState<GoogleFormSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');

  // Selected registration for modal detail
  const [selectedRecord, setSelectedRecord] = useState<ParsedStudentRegistration | null>(null);

  const fetchResponses = async () => {
    if (!token || !formDetails) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFormResponses(token, formDetails.formId);
      setSubmissions(data);
      setLastRefreshed(new Date());
    } catch (err: any) {
      console.error('Failed to fetch responses:', err);
      setError(err.message || 'Failed to fetch form responses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && formDetails) {
      fetchResponses();
    }
  }, [token, formDetails?.formId]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh || !token || !formDetails) return;
    const interval = setInterval(() => {
      fetchResponses();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, token, formDetails?.formId]);

  // Parse submissions into structured students
  const registrations: ParsedStudentRegistration[] = useMemo(() => {
    if (!formDetails) return [];
    return parseRegistrations(formDetails, submissions);
  }, [formDetails, submissions]);

  // Departments list for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => {
      if (r.department && r.department !== 'Not Specified') {
        set.add(r.department);
      }
    });
    return Array.from(set).sort();
  }, [registrations]);

  // Years list for filter
  const yearsList = useMemo(() => {
    const set = new Set<string>();
    registrations.forEach((r) => {
      if (r.yearOfStudy && r.yearOfStudy !== 'Not Specified') {
        set.add(r.yearOfStudy);
      }
    });
    return Array.from(set).sort();
  }, [registrations]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.email && r.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDept =
        selectedDeptFilter === 'ALL' || r.department === selectedDeptFilter;

      const matchYear =
        selectedYearFilter === 'ALL' || r.yearOfStudy === selectedYearFilter;

      return matchSearch && matchDept && matchYear;
    });
  }, [registrations, searchQuery, selectedDeptFilter, selectedYearFilter]);

  // Analytics Stats
  const stats = useMemo(() => {
    const total = registrations.length;
    const deptCounts: Record<string, number> = {};
    const yearCounts: Record<string, number> = {};
    const courseCounts: Record<string, number> = {};

    registrations.forEach((r) => {
      const d = r.department || 'Unspecified';
      deptCounts[d] = (deptCounts[d] || 0) + 1;

      const y = r.yearOfStudy || 'Unspecified';
      yearCounts[y] = (yearCounts[y] || 0) + 1;

      const c = r.course || 'Unspecified';
      courseCounts[c] = (courseCounts[c] || 0) + 1;
    });

    const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
    const topYear = Object.entries(yearCounts).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      deptCounts,
      yearCounts,
      courseCounts,
      topDept: topDept ? topDept[0] : 'None',
      topYear: topYear ? topYear[0] : 'None',
    };
  }, [registrations]);

  // Export to CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) return;
    const headers = ['Response ID', 'Submission Date', 'Full Name', 'Course', 'Year of Study', 'Department', 'Email'];
    const rows = registrations.map((r) => [
      `"${r.responseId}"`,
      `"${new Date(r.submittedAt).toLocaleString()}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.course.replace(/"/g, '""')}"`,
      `"${r.yearOfStudy.replace(/"/g, '""')}"`,
      `"${r.department.replace(/"/g, '""')}"`,
      `"${r.email || ''}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `student_registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!formDetails) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-gray-900">
          No Active Form Selected
        </h3>
        <p className="text-xs text-gray-500">
          Create a Google Form with the builder to start collecting and viewing student registrations in real-time.
        </p>
        <button
          onClick={onOpenForm}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors cursor-pointer"
        >
          Go to Form Builder
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Form Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              {formDetails.info.title}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-100 text-purple-700">
              Live Submissions
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
            <span>Form ID: {formDetails.formId}</span>
            {lastRefreshed && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Updated: {lastRefreshed.toLocaleTimeString()}
                </span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-3 py-2 rounded-xl font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
              autoRefresh
                ? 'bg-purple-50 border-purple-300 text-purple-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-purple-600 animate-pulse' : 'bg-gray-300'}`} />
            <span>Live Auto-Sync (15s)</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchResponses}
            disabled={isLoading}
            className="p-2 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh submissions now"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-600' : ''}`} />
          </button>

          {/* CSV Export Button */}
          <button
            onClick={handleExportCSV}
            disabled={registrations.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Export registrations as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* Fill Form in Google */}
          {formDetails.responderUri && (
            <a
              href={formDetails.responderUri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              <span>Register a Student</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between">
          <span>Failed to load submissions: {error}</span>
          <button
            onClick={fetchResponses}
            className="underline font-semibold hover:text-red-900 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Registrations */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Registered Students
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stats.total}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Verified form submissions
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Departments Represented */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Departments
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {Object.keys(stats.deptCounts).length}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]">
              Top: {stats.topDept}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Year of Study Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Most Represented Stage
            </p>
            <p className="text-lg font-bold text-gray-900 mt-1 truncate max-w-[150px]">
              {stats.topYear}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {stats.yearCounts[stats.topYear] || 0} students enrolled
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Courses Diversity */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Total Courses
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {Object.keys(stats.courseCounts).length}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Unique degree programs
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Visual Distribution Summary */}
      {registrations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Department Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Registrations by Department</span>
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.entries(stats.deptCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => {
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-800 truncate max-w-[200px]" title={dept}>
                          {dept}
                        </span>
                        <span className="text-gray-500 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Year of Study Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Registrations by Year of Study</span>
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.entries(stats.yearCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([year, count]) => {
                  const pct = Math.round((count / stats.total) * 100);
                  return (
                    <div key={year} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-gray-800 truncate max-w-[200px]">
                          {year}
                        </span>
                        <span className="text-gray-500 font-mono">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Main Registrations Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filters Bar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, course, or dept..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Department & Year Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Department Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">Dept:</span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="text-xs bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Departments</option>
                {departmentsList.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium hidden sm:inline">Year:</span>
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="text-xs bg-white border border-gray-300 rounded-xl px-2.5 py-1.5 text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Years</option>
                {yearsList.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {(searchQuery || selectedDeptFilter !== 'ALL' || selectedYearFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDeptFilter('ALL');
                  setSelectedYearFilter('ALL');
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-medium px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        {filteredRegistrations.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            {registrations.length === 0 ? (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  No registrations submitted yet
                </p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Submissions made to the Google Form will appear here instantly. Share the responder link with students or submit a test entry to test it out!
                </p>
                {formDetails.responderUri && (
                  <div className="pt-2">
                    <a
                      href={formDetails.responderUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors cursor-pointer"
                    >
                      <span>Open Form & Submit First Entry</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-900">
                  No matching registrations found
                </p>
                <p className="text-xs text-gray-500">
                  Try adjusting your search query or department/year filters.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Year of Study</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Submitted At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRegistrations.map((reg, index) => (
                  <tr
                    key={reg.responseId || index}
                    className="hover:bg-purple-50/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedRecord(reg)}
                  >
                    <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {reg.name ? reg.name[0].toUpperCase() : 'S'}
                      </div>
                      <span className="truncate max-w-[160px]">{reg.name}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                        {reg.course}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
                        {reg.yearOfStudy}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium truncate max-w-[200px]" title={reg.department}>
                      {reg.department}
                    </td>
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                      {reg.submittedAt ? new Date(reg.submittedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecord(reg);
                        }}
                        className="p-1 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer"
                        title="View full submission details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                  {selectedRecord.name ? selectedRecord.name[0].toUpperCase() : 'S'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedRecord.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Student Registration Record
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl space-y-2 border border-gray-200/70">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Name of Person:</span>
                  <span className="col-span-2 font-semibold text-gray-900">{selectedRecord.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Course:</span>
                  <span className="col-span-2 font-semibold text-blue-700">{selectedRecord.course}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Year of Study:</span>
                  <span className="col-span-2 font-semibold text-emerald-700">{selectedRecord.yearOfStudy}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Department:</span>
                  <span className="col-span-2 font-semibold text-amber-800">{selectedRecord.department}</span>
                </div>
                {selectedRecord.email && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 font-medium">Email:</span>
                    <span className="col-span-2 font-mono text-gray-800">{selectedRecord.email}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Submitted:</span>
                  <span className="col-span-2 text-gray-600">
                    {new Date(selectedRecord.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500 font-medium">Submission ID:</span>
                  <span className="col-span-2 font-mono text-[10px] text-gray-500 truncate">
                    {selectedRecord.responseId}
                  </span>
                </div>
              </div>

              {/* Any additional answers */}
              {Object.keys(selectedRecord.otherAnswers).length > 0 && (
                <div className="p-3 bg-purple-50/50 rounded-xl space-y-1.5 border border-purple-100">
                  <p className="font-semibold text-purple-900 text-xs">Additional Information</p>
                  {Object.entries(selectedRecord.otherAnswers).map(([k, v]) => (
                    <div key={k} className="grid grid-cols-3 gap-2 text-[11px]">
                      <span className="text-gray-500">{k}:</span>
                      <span className="col-span-2 font-medium text-gray-800">{v}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRecord(null)}
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
