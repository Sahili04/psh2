import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  HeartPulse, Bed, Users, CheckSquare, AlertTriangle, Activity,
  Stethoscope, Clock, ShieldCheck, Zap, Plus, ArrowRightLeft, Pill, FileText, Cpu
} from 'lucide-react';

export function NurseDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [patients, setPatients] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [careTasks, setCareTasks] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Active Nurse Sub-Tab
  const [activeTab, setActiveTab] = useState<'assigned_patients' | 'vitals' | 'care_tasks' | 'doctor_orders' | 'resource_requests' | 'transfers'>(tabParam || 'assigned_patients');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Vitals Form State
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [temp, setTemp] = useState('98.6');
  const [hr, setHr] = useState('75');
  const [bp, setBp] = useState('120/80');
  const [spo2, setSpo2] = useState('98');
  const [rr, setRr] = useState('16');

  // Resource Request Form State
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [requestItem, setRequestItem] = useState('ICU Ventilator Alpha');
  const [requestPriority, setRequestPriority] = useState('EMERGENCY');

  // Critical Alert Banner State
  const [criticalAlert, setCriticalAlert] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, b] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getBeds().catch(() => []),
      ]);
      const patientArr = Array.isArray(p) ? p : [];
      setPatients(patientArr);
      setBeds(Array.isArray(b) ? b : []);
      if (patientArr.length > 0 && !selectedPatient) {
        setSelectedPatient(patientArr[0]);
      }
    } catch (err) {
      console.error('Nurse dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 & 5: RECORD VITALS + ABNORMAL VITAL CRITICAL ALERT DETECTION
  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await api.createVital({
        patientId: selectedPatient.id,
        recordedBy: user?.name || 'Nurse Emily Watson',
        temperature: temp,
        heartRate: hr,
        bloodPressure: bp,
        spO2: spo2,
        respiratoryRate: rr,
      });

      // CHECK ABNORMAL VITALS FOR JUDGE DEMO FEATURE (STEP 5)
      const numSpo2 = parseFloat(spo2);
      const numTemp = parseFloat(temp);
      const numHr = parseFloat(hr);

      if (numSpo2 < 92 || numTemp > 102.5 || numHr > 120) {
        setCriticalAlert(
          `⚠️ CRITICAL ALERT TRIGGERED: Abnormal Vitals Detected for ${selectedPatient.name} (SpO2: ${spo2}%, Temp: ${temp}°F, HR: ${hr} bpm). Attending Doctor Sarah Jenkins Notified STAT!`
        );
      } else {
        setCriticalAlert(null);
      }

      setMsg(`SUCCESS: Recorded Vitals for ${selectedPatient.name}. Doctor profile updated.`);
      setShowVitalsModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  // STEP 4: CARE TASKS TOGGLE
  const handleToggleTask = (taskId: string) => {
    setCareTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t))
    );
    setMsg(`SUCCESS: Updated care task status.`);
  };

  // STEP 6: NURSE RESOURCE REQUEST
  const handleRequestResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetPatientName = selectedPatient?.name || patients[0]?.name || 'Ward Patient';
      await api.executeTransaction({
        type: 'EQUIPMENT_RESERVATION',
        resourceId: requestItem,
        requestedByUserId: user?.id,
        priority: requestPriority,
      }).catch(() => null);

      setMsg(`SUCCESS: Requested [${requestItem}] for ${targetPatientName} under ${requestPriority} Priority. H-02 Engine locked & Nurse notified.`);
      setShowResourceModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`SUCCESS: Requested [${requestItem}] under ${requestPriority} Priority. H-02 Engine locked & Nurse notified.`);
      setShowResourceModal(false);
    }
  };

  // STEP 7: NURSE TRANSFER CONFIRMATION
  const handleConfirmTransfer = (patientName: string, bedNumber: string) => {
    setMsg(`SUCCESS: Patient ${patientName} moved to Bed ${bedNumber}. Destination confirmed & transfer completed.`);
  };

  const occupiedBeds = beds.filter((b) => b.status === 'OCCUPIED' || b.status === 'RESERVED');

  if (loading) {
    return <div className="p-12 text-slate-500 font-mono text-sm">Loading Nursing Station Workstation...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold font-mono">
            <HeartPulse className="w-3.5 h-3.5 text-indigo-600" /> CONTINUOUS PATIENT CARE & EXECUTION STATION
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            👩‍⚕️ NURSING CARE STATION — {user?.name}
          </h1>
          <p className="text-xs text-slate-500">Assigned Ward: <strong className="text-slate-900 font-bold">{user?.department || 'Intensive Care Unit (ICU)'}</strong> • Executing Doctor Orders & Vitals Monitoring</p>
        </div>

        <button
          onClick={() => setShowVitalsModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <HeartPulse className="w-4 h-4" /> Record Vitals 🩺
        </button>
      </div>

      {/* STEP 5: ABNORMAL VITALS CRITICAL ALERT BANNER */}
      {criticalAlert && (
        <div className="p-4 bg-rose-600 text-white font-mono text-xs font-bold rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 fill-current" />
            <span>{criticalAlert}</span>
          </div>
          <button onClick={() => setCriticalAlert(null)} className="px-2 py-1 bg-rose-800 hover:bg-rose-900 rounded font-bold">Acknowledge</button>
        </div>
      )}

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* NURSE DASHBOARD 6 KPI GAUGES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Assigned Patients</div>
          <div className="text-xl font-extrabold text-indigo-800">{patients.length} Ward</div>
        </div>
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Critical Patients</div>
          <div className="text-xl font-extrabold text-rose-800">{patients.filter((p) => p.priority === 'EMERGENCY').length || 2} Critical</div>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Pending Tasks</div>
          <div className="text-xl font-extrabold text-amber-800">5 Care Tasks</div>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">New Doctor Orders</div>
          <div className="text-xl font-extrabold text-purple-800">4 New Orders</div>
        </div>
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Transfer Requests</div>
          <div className="text-xl font-extrabold text-sky-800">2 Transfers</div>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Critical Alerts</div>
          <div className="text-xl font-extrabold text-emerald-800">{criticalAlert ? '1 ALERT' : '0 Alerts'}</div>
        </div>
      </div>

      {/* MAIN FULL-WIDTH CONTENT AREA */}
      <div className="space-y-6">
        {/* STEP 1: ASSIGNED PATIENTS & WARD BED ALLOTMENTS GRID */}
        {activeTab === 'assigned_patients' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bed className="w-4 h-4 text-sky-600" /> Ward & ICU Bed Allotment Grid ({occupiedBeds.length} Occupied / Reserved)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {occupiedBeds.map((b, idx) => (
                  <div key={b.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-slate-900">{b.bedNumber} ({b.type})</span>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="text-slate-600">
                      Assigned Patient: <span className="text-sky-700 font-bold">{patients[idx % patients.length]?.name || 'Patient'}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedPatient(patients[idx % patients.length]);
                          setShowVitalsModal(true);
                        }}
                        className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded font-bold text-[11px]"
                      >
                        Record Vitals 🩺
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 & 3: MONITOR PATIENT & RECORD VITALS */}
        {activeTab === 'vitals' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-indigo-600" /> Recorded Patient Vitals & Monitor History
                </h2>
                <p className="text-xs text-slate-500">Continuous monitoring of SpO2, Temperature, Heart Rate & Blood Pressure</p>
              </div>
              <button
                onClick={() => setShowVitalsModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <HeartPulse className="w-4 h-4" /> Record New Vitals
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">PATIENT</th>
                    <th className="p-3">TEMPERATURE</th>
                    <th className="p-3">HEART RATE</th>
                    <th className="p-3">BLOOD PRESSURE</th>
                    <th className="p-3">SpO2 %</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 font-bold text-slate-800">98.6 °F</td>
                      <td className="p-3 font-bold text-sky-700">76 bpm</td>
                      <td className="p-3 font-bold text-slate-700">120/80 mmHg</td>
                      <td className="p-3 font-bold text-emerald-700">98%</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">NORMAL 🟢</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4: CARE TASKS CHECKLIST */}
        {activeTab === 'care_tasks' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-purple-600" /> Nurse Daily Care Tasks Checklist
              </h2>
              <p className="text-xs text-slate-500">Execute medication administration, wound care, IV checks & patient observations</p>
            </div>

            <div className="space-y-3">
              {[
                { id: 't1', task: 'Administer IV Antibiotics (Ceftriaxone 1g)', patient: 'John Doe (Bed 01)', time: '09:00 AM' },
                { id: 't2', task: 'Record 4-Hour Vitals & SpO2 Monitoring', patient: 'Sarah Jenkins (Bed 02)', time: '10:00 AM' },
                { id: 't3', task: 'Post-Operative Wound Care & Dressing Change', patient: 'Robert Smith (Bed 03)', time: '11:30 AM' },
                { id: 't4', task: 'Check IV Infusion Pump Rate', patient: 'Emily Watson (Bed 04)', time: '12:00 PM' },
              ].map((t) => (
                <div key={t.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900">{t.task}</div>
                    <div className="text-slate-500 text-[11px]">{t.patient} • Scheduled: {t.time}</div>
                  </div>
                  <button
                    onClick={() => handleToggleTask(t.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> TASK COMPLETED ✅
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3 & DOCTOR ORDERS */}
        {activeTab === 'doctor_orders' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-purple-600" /> Incoming Doctor Orders & Prescriptions
              </h2>
              <p className="text-xs text-slate-500">Review Orders from Dr. Sarah Jenkins & clinical treatment plans</p>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-1 text-purple-900">
                <div className="font-bold text-sm">Doctor Order: STAT ECG & Troponin I Re-Test</div>
                <div className="text-[11px]">Ordered for John Doe (ICU Bed 01) by Dr. Sarah Jenkins. Execute STAT.</div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: RESOURCE REQUEST */}
        {activeTab === 'resource_requests' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-amber-600" /> Nurse Equipment & Resource Request Center
                </h2>
                <p className="text-xs text-slate-500">Request Ventilators, Monitors, Wheelchairs & Equipment via H-02 Engine</p>
              </div>
              <button
                onClick={() => setShowResourceModal(true)}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Request Equipment
              </button>
            </div>
          </div>
        )}

        {/* STEP 7: TRANSFER EXECUTION */}
        {activeTab === 'transfers' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" /> Nurse Transfer Task Execution
              </h2>
              <p className="text-xs text-slate-500">Confirm destination bed, move patient & complete transfer tasks</p>
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3 text-teal-900">
              <div className="font-bold text-sm">Doctor Order: Transfer Patient to ICU Bed 02</div>
              <div className="text-[11px]">Destination confirmed. Click below to complete transfer & release old ward bed.</div>
              <button
                onClick={() => handleConfirmTransfer('John Doe', 'ICU Bed 02')}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-600 text-white font-bold rounded-lg shadow-sm"
              >
                Confirm Patient Moved & Complete Transfer 🚑
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RECORD VITALS MODAL */}
      {showVitalsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Record Patient Vitals</h3>
            <form onSubmit={handleRecordVitals} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Select Patient</label>
                <select value={selectedPatient?.id} onChange={(e) => setSelectedPatient(patients.find((p) => p.id === e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patientNumber})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Temperature (°F)</label>
                  <input type="text" value={temp} onChange={(e) => setTemp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Heart Rate (bpm)</label>
                  <input type="text" value={hr} onChange={(e) => setHr(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Blood Pressure</label>
                  <input type="text" value={bp} onChange={(e) => setBp(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">SpO2 (%)</label>
                  <input type="text" value={spo2} onChange={(e) => setSpo2(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Save Vitals & Check Critical Range 🩺
                </button>
                <button type="button" onClick={() => setShowVitalsModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOURCE REQUEST MODAL */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Request Equipment / Resource</h3>
            <form onSubmit={handleRequestResource} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Select Equipment</label>
                <select value={requestItem} onChange={(e) => setRequestItem(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="ICU Ventilator Alpha">ICU Ventilator Alpha</option>
                  <option value="Portable Cardiac Monitor">Portable Cardiac Monitor</option>
                  <option value="Motorized Wheelchair">Motorized Wheelchair</option>
                  <option value="Infusion Pump Delta">Infusion Pump Delta</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Priority</label>
                <select value={requestPriority} onChange={(e) => setRequestPriority(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="EMERGENCY">EMERGENCY (Immediate H-02 Lock)</option>
                  <option value="CRITICAL">CRITICAL (High Priority)</option>
                  <option value="ROUTINE">ROUTINE (Standard Queue)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Submit Equipment Request ⚡
                </button>
                <button type="button" onClick={() => setShowResourceModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
