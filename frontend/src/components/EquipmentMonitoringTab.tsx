import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Activity, AlertTriangle, Battery, CheckCircle2, Clock, Calendar,
  ShieldCheck, Wrench, Search, RefreshCw, UserCheck, ChevronRight, FileText, Plus
} from 'lucide-react';

interface EquipmentMonitoringTabProps {
  departmentFilter?: string; // Optional department filter
  isDoctorView?: boolean;
}

export function EquipmentMonitoringTab({ departmentFilter, isDoctorView = false }: EquipmentMonitoringTabProps) {
  const { user } = useAuth();
  const { addToast } = useSocket();

  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Survey Modal State
  const [selectedEquipment, setSelectedEquipment] = useState<any | null>(null);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [healthScore, setHealthScore] = useState(95);
  const [batteryLevel, setBatteryLevel] = useState(90);
  const [sensorAccuracy, setSensorAccuracy] = useState('99.5%');
  const [calibrationStatus, setCalibrationStatus] = useState('CALIBRATED');
  const [nextSurveyDateStr, setNextSurveyDateStr] = useState('');
  const [surveyNotes, setSurveyNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Inspection Logs Modal
  const [viewHistoryEquipment, setViewHistoryEquipment] = useState<any | null>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    setLoading(true);
    try {
      const data = await api.getEquipment();
      setEquipmentList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper date setter for Next Survey Date
  const setPresetDateDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setNextSurveyDateStr(d.toISOString().split('T')[0]);
  };

  const openSurveyModal = (eq: any) => {
    setSelectedEquipment(eq);
    setHealthScore(eq.healthScore ?? 95);
    setBatteryLevel(eq.batteryLevel ?? 90);
    setSensorAccuracy(eq.sensorAccuracy || '99.5%');
    setCalibrationStatus(eq.calibrationStatus || 'CALIBRATED');
    setSurveyNotes(eq.surveyNotes || '');
    
    // Default next survey to 7 days from now
    const defaultNext = new Date();
    defaultNext.setDate(defaultNext.getDate() + 7);
    setNextSurveyDateStr(defaultNext.toISOString().split('T')[0]);

    setShowSurveyModal(true);
  };

  const handleSurveySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    setSubmitting(true);
    try {
      const adminName = user?.name || 'Department Admin';
      await api.surveyEquipment(selectedEquipment.id, {
        doctorName: adminName, // sending adminName as doctorName for API compatibility
        healthScore,
        calibrationStatus,
        batteryLevel,
        sensorAccuracy,
        nextSurveyDate: nextSurveyDateStr,
        notes: surveyNotes,
      });

      addToast(
        'success',
        'Machine Survey Completed',
        `Survey for ${selectedEquipment.name} logged by ${adminName}. Next inspection: ${nextSurveyDateStr}`
      );

      setShowSurveyModal(false);
      loadEquipment();
    } catch (err: any) {
      addToast('error', 'Survey Failed', err.message || 'Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const openHistoryModal = async (eq: any) => {
    setViewHistoryEquipment(eq);
    setLoadingHistory(true);
    try {
      const logs = await api.getEquipmentSurveys(eq.id);
      setHistoryLogs(Array.isArray(logs) ? logs : []);
    } catch (err: any) {
      setHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Filter Logic
  let filtered = equipmentList.filter((eq) => {
    if (departmentFilter && eq.departmentId !== departmentFilter && eq.department?.name !== departmentFilter) {
      return false;
    }
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'DUE_SOON' && eq.calibrationStatus !== 'DUE_SOON') return false;
      if (filterStatus === 'OVERDUE' && eq.calibrationStatus !== 'OVERDUE') return false;
      if (filterStatus === 'CALIBRATED' && eq.calibrationStatus !== 'CALIBRATED') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        eq.name.toLowerCase().includes(q) ||
        eq.serialNumber.toLowerCase().includes(q) ||
        eq.type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculate Overdue & Due Soon alerts
  const now = new Date();
  const alertDueItems = equipmentList.filter((eq) => {
    if (departmentFilter && eq.departmentId !== departmentFilter && eq.department?.name !== departmentFilter) {
      return false;
    }
    if (eq.calibrationStatus === 'OVERDUE' || eq.calibrationStatus === 'DUE_SOON') return true;
    if (eq.nextSurveyDate) {
      const nextDate = new Date(eq.nextSurveyDate);
      return nextDate <= new Date(now.getTime() + 24 * 60 * 60 * 1000); // due within 24h
    }
    return false;
  });

  const getCalibrationBadge = (status: string, nextDate?: string) => {
    const isOverdue = status === 'OVERDUE' || (nextDate && new Date(nextDate) < now);
    const isDueSoon = status === 'DUE_SOON' || (nextDate && new Date(nextDate) <= new Date(now.getTime() + 24 * 60 * 60 * 1000));

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> CALIBRATION OVERDUE
        </span>
      );
    }
    if (isDueSoon) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          <Clock className="w-3.5 h-3.5 text-amber-600" /> INSPECTION DUE SOON
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> CALIBRATED & HEALTHY
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Activity className="w-4 h-4 animate-pulse" /> Departmental Instrument Monitoring
          </div>
          <h2 className="text-2xl font-bold mt-1">Hospital Equipment Health & Survey Control</h2>
          <p className="text-slate-300 text-sm mt-1">
            Real-time machine health parameters, department admin survey logging, and assigned calibration alerts.
          </p>
        </div>
        <button
          onClick={loadEquipment}
          className="flex items-center gap-2 px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 rounded-xl border border-sky-400/30 text-sm font-medium transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Telemetry
        </button>
      </div>

      {/* ALERT BANNER if calibration is due */}
      {alertDueItems.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border-2 border-rose-500/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-500 text-white rounded-xl shadow-md">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-rose-900">
                  ⚠️ Action Required: {alertDueItems.length} Machine(s) Due for Department Admin Calibration & Inspection
                </h3>
                <span className="px-2 py-0.5 bg-rose-200 text-rose-800 rounded-md text-xs font-mono font-bold">
                  HIGH PRIORITY
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-1">
                The following hospital instruments require parameter survey verification and next date reassignment:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                {alertDueItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white/90 rounded-xl border border-rose-200 text-xs shadow-sm"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.name}</span>
                      <span className="text-slate-500 ml-2 font-mono">({item.serialNumber})</span>
                      <div className="text-[11px] text-rose-700 font-medium">
                        Next Due Date:{' '}
                        {item.nextSurveyDate ? new Date(item.nextSurveyDate).toLocaleDateString() : 'Immediate'}
                      </div>
                    </div>
                    <button
                      onClick={() => openSurveyModal(item)}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow transition-all flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Inspect Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by machine name, type, serial..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CALIBRATED', 'DUE_SOON', 'OVERDUE'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-sky-600 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Card Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" /> Loading equipment telemetry...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No hospital equipment matching your current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((eq) => (
            <div
              key={eq.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Title & Badges */}
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{eq.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono mt-0.5">
                      <span>SN: {eq.serialNumber}</span>
                      <span>•</span>
                      <span className="text-sky-700 font-medium">{eq.department?.name || 'General'}</span>
                    </div>
                  </div>
                  {getCalibrationBadge(eq.calibrationStatus, eq.nextSurveyDate)}
                </div>

                {/* Machine Health Metrics Gauges */}
                <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Health Score</div>
                    <div className={`text-base font-bold ${eq.healthScore >= 90 ? 'text-emerald-600' : eq.healthScore >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {eq.healthScore ?? 100}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Battery</div>
                    <div className="text-base font-bold text-slate-800 flex items-center justify-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-sky-600" /> {eq.batteryLevel ?? 100}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Accuracy</div>
                    <div className="text-base font-bold text-indigo-600">
                      {eq.sensorAccuracy || '99.5%'}
                    </div>
                  </div>
                </div>

                {/* Survey Tracking Info */}
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3 font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Last Assessor:</span>
                    <span className="font-semibold text-slate-800">{eq.surveyedByDoctorName || 'Pending First Survey'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Last Inspection:</span>
                    <span>{eq.lastSurveyDate ? new Date(eq.lastSurveyDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center bg-sky-50 p-2 rounded-lg border border-sky-100">
                    <span className="text-sky-900 font-bold flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-600" /> Next Assigned Date:
                    </span>
                    <span className="font-bold text-sky-900">
                      {eq.nextSurveyDate ? new Date(eq.nextSurveyDate).toLocaleDateString() : 'Unassigned'}
                    </span>
                  </div>

                  {eq.surveyNotes && (
                    <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100 mt-2">
                      "{eq.surveyNotes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => openSurveyModal(eq)}
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" /> Conduct Admin Survey
                </button>
                <button
                  onClick={() => openHistoryModal(eq)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                  title="View Past Inspection Logs"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CONDUCT DEPARTMENT ADMIN SURVEY MODAL */}
      {showSurveyModal && selectedEquipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-sky-600" /> Machine Health Survey & Calibration
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  {selectedEquipment.name} ({selectedEquipment.serialNumber})
                </p>
              </div>
              <button
                onClick={() => setShowSurveyModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSurveySubmit} className="space-y-4">
              {/* Health Score Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Operational Health Score (0 - 100%):</span>
                  <span className="text-sky-600 font-bold text-sm">{healthScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={healthScore}
                  onChange={(e) => setHealthScore(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                />
              </div>

              {/* Battery Level Slider */}
              <div>
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700 mb-1">
                  <span>Battery Level %:</span>
                  <span className="text-emerald-600 font-bold text-sm">{batteryLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={batteryLevel}
                  onChange={(e) => setBatteryLevel(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              {/* Grid: Calibration Status & Sensor Accuracy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Calibration Status</label>
                  <select
                    value={calibrationStatus}
                    onChange={(e) => setCalibrationStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="CALIBRATED">CALIBRATED & READY</option>
                    <option value="DUE_SOON">DUE SOON</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="MAINTENANCE_REQUIRED">NEEDS MAINTENANCE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sensor Accuracy</label>
                  <input
                    type="text"
                    value={sensorAccuracy}
                    onChange={(e) => setSensorAccuracy(e.target.value)}
                    placeholder="e.g. 99.8%"
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Assign Next Survey Date */}
              <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200 space-y-2">
                <label className="block text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-sky-600" /> Assign Next Survey Date (Alert Trigger)
                </label>

                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setPresetDateDays(7)}
                    className="px-2.5 py-1 bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-xs font-semibold transition-all"
                  >
                    + 7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDateDays(14)}
                    className="px-2.5 py-1 bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-xs font-semibold transition-all"
                  >
                    + 14 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDateDays(30)}
                    className="px-2.5 py-1 bg-white hover:bg-sky-100 border border-sky-300 text-sky-800 rounded-lg text-xs font-semibold transition-all"
                  >
                    + 30 Days
                  </button>
                </div>

                <input
                  type="date"
                  value={nextSurveyDateStr}
                  onChange={(e) => setNextSurveyDateStr(e.target.value)}
                  required
                  className="w-full p-2 bg-white border border-sky-300 rounded-xl text-xs font-bold text-sky-900 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Department Admin Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Admin Survey Notes</label>
                <textarea
                  rows={2}
                  value={surveyNotes}
                  onChange={(e) => setSurveyNotes(e.target.value)}
                  placeholder="Notes on machine condition, sensor calibration, or maintenance requirements..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow transition-all flex items-center gap-1.5"
                >
                  {submitting ? 'Logging Survey...' : 'Complete & Schedule Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECTION HISTORY MODAL */}
      {viewHistoryEquipment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inspection History</h3>
                <p className="text-xs text-slate-500 font-mono">{viewHistoryEquipment.name}</p>
              </div>
              <button onClick={() => setViewHistoryEquipment(null)} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
            </div>

            {loadingHistory ? (
              <div className="text-center py-6 text-xs text-slate-500">Loading audit history...</div>
            ) : historyLogs.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">No prior inspection logs.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {historyLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{log.doctorName}</span>
                      <span className="text-sky-700 font-mono">{log.healthScore}% Health</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Surveyed: {new Date(log.surveyDate).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-600 italic mt-1 bg-white p-1.5 rounded border border-slate-100">
                      "{log.notes}"
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewHistoryEquipment(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
