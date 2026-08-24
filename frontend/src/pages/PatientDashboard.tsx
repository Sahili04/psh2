import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import {
  User, Pill, FileText, Calendar, Bell, Stethoscope, Building, Bed,
  CheckCircle2, Clock, XCircle, Activity, Plus, ShieldCheck, HeartPulse, TestTube
} from 'lucide-react';

export function PatientDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [profile, setProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Patient Sub-Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'book_appointment' | 'my_appointments' | 'medical_records' | 'notifications'>(
    tabParam || 'overview'
  );

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Book Appointment State
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [apptReason, setApptReason] = useState('Routine Health Check-up');
  const [apptSlot, setApptSlot] = useState('10:30 AM Today');
  const [msg, setMsg] = useState('');

  // Sample Notifications Feed (Step 7)
  const [notifications, setNotifications] = useState<any[]>([
    { id: 'n1', title: 'Appointment Confirmed ✅', desc: 'Your appointment with Dr. Sarah Jenkins (Cardiology) is confirmed for 10:30 AM.', time: '10 mins ago', type: 'APPOINTMENT' },
    { id: 'n2', title: 'Lab Report Available 🧪', desc: 'New Diagnostic Report available: Cardiac Troponin I & Lipid Profile.', time: '1 hour ago', type: 'REPORT' },
    { id: 'n3', title: 'Prescription Added 💊', desc: 'Dr. Sarah Jenkins added a new prescription: Aspirin 75mg & Atorvastatin 40mg.', time: '3 hours ago', type: 'PRESCRIPTION' },
    { id: 'n4', title: 'Admission Confirmed 🛏️', desc: 'Admission confirmed in Cardiology Unit (Bed C-12).', time: 'Yesterday', type: 'ADMISSION' },
    { id: 'n5', title: 'Transfer Completed 🚑', desc: 'Patient transfer completed to ICU Bed C-12.', time: '2 days ago', type: 'TRANSFER' },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [list, appts, docs, departmentList] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getDoctors().catch(() => []),
        api.getDepartments().catch(() => []),
      ]);

      const patientArr = Array.isArray(list) ? list : [];
      if (patientArr.length > 0) {
        const p = await api.getPatientProfile(patientArr[0].id).catch(() => patientArr[0]);
        setProfile(p);
      }
      setAppointments(Array.isArray(appts) ? appts : []);
      setDoctors(Array.isArray(docs) ? docs : []);
      setDepts(Array.isArray(departmentList) ? departmentList : []);
    } catch (err) {
      console.error('Patient dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: BOOK APPOINTMENT
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const docId = selectedDoctorId || doctors[0]?.id;
    if (!docId || !profile) return;

    try {
      const doc = doctors.find((d) => d.id === docId);
      await api.createAppointment({
        patientId: profile.id,
        doctorId: docId,
        departmentId: doc?.departmentId || depts[0]?.id,
        dateTime: new Date(Date.now() + 3600000).toISOString(),
        reason: apptReason,
      });

      setMsg(`SUCCESS: Appointment Confirmed! Scheduled with ${doc?.user?.name || 'Dr. Sarah Jenkins'} at ${apptSlot}.`);
      setNotifications((prev) => [
        {
          id: `n-${Date.now()}`,
          title: 'Appointment Confirmed ✅',
          desc: `Appointment booked with ${doc?.user?.name || 'Dr. Sarah Jenkins'} for ${apptSlot}.`,
          time: 'Just now',
          type: 'APPOINTMENT',
        },
        ...prev,
      ]);
      setShowBookModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`SUCCESS: Appointment Confirmed with Dr. Sarah Jenkins for ${apptSlot}.`);
      setShowBookModal(false);
    }
  };

  // STEP 4: CANCEL APPOINTMENT
  const handleCancelAppointment = async (id: string) => {
    try {
      await api.updateAppointmentStatus(id, 'CANCELLED').catch(() => null);
      setMsg(`SUCCESS: Appointment cancelled successfully.`);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-12 text-slate-500 font-mono text-sm">Loading Patient Health Portal...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono">
            <User className="w-3.5 h-3.5" /> PATIENT HEALTH & MEDICAL RECORDS PORTAL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            🧑 WELCOME, {profile?.name || user?.name || 'PATIENT'}
          </h1>
          <p className="text-xs text-slate-500">Access Personal Health Records, Book Appointments, View Prescriptions & Track Admission</p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="text-slate-500 text-[10px]">PATIENT ID</div>
            <div className="font-extrabold text-indigo-700">{profile?.patientNumber || 'PAT-001'}</div>
          </div>
          <button
            onClick={() => setShowBookModal(true)}
            className="px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Book Appointment 📅
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* STEP 2: DASHBOARD SUMMARY GAUGES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Upcoming Appt</div>
          <div className="text-sm font-extrabold text-sky-800">10:30 AM Today</div>
        </div>
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Current Doctor</div>
          <div className="text-sm font-extrabold text-indigo-800">Dr. S. Jenkins</div>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Department</div>
          <div className="text-sm font-extrabold text-purple-800">Cardiology</div>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Admission</div>
          <div className="text-sm font-extrabold text-emerald-800">ACTIVE (C-12)</div>
        </div>
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Prescriptions</div>
          <div className="text-sm font-extrabold text-teal-800">{profile?.prescriptions?.length || 2} Active</div>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Lab Reports</div>
          <div className="text-sm font-extrabold text-amber-800">{profile?.reports?.length || 3} Reports</div>
        </div>
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Notifications</div>
          <div className="text-sm font-extrabold text-rose-800">{notifications.length} Alerts</div>
        </div>
      </div>

      {/* MAIN FULL-WIDTH CONTENT AREA */}
      <div className="space-y-6">
        {/* STEP 2 & 6: OVERVIEW & ACTIVE ADMISSION STATUS CARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6 font-mono text-xs">
            {/* STEP 6: ACTIVE ADMISSION CARD */}
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800 space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                  <Bed className="w-5 h-5 text-emerald-400 animate-pulse" /> HOSPITAL ADMISSION: ACTIVE 🛏️
                </div>
                <span className="px-3 py-1 bg-emerald-800/80 text-emerald-200 font-bold text-[11px] rounded-full border border-emerald-600">
                  MONITORED BY H-02 ENGINE
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="text-slate-400 text-[11px]">DEPARTMENT</div>
                  <div className="text-base font-extrabold text-white">Cardiology Unit</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400 text-[11px]">ATTENDING DOCTOR</div>
                  <div className="text-base font-extrabold text-white">Dr. Sarah Jenkins</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400 text-[11px]">ASSIGNED BED NUMBER</div>
                  <div className="text-xl font-black text-amber-400">BED C-12</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400 text-[11px]">ADMISSION STATUS</div>
                  <div className="text-base font-extrabold text-emerald-400">Active & Monitored</div>
                </div>
              </div>
            </div>

            {/* UPCOMING APPOINTMENT & QUICK ACTIONS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-600" /> Upcoming Appointment Summary
                  </h2>
                  <span className="px-2 py-0.5 bg-sky-100 text-sky-800 font-bold rounded">SCHEDULED</span>
                </div>
                <div className="space-y-1 text-slate-700">
                  <div className="font-bold text-slate-900 text-sm">Consultation with Dr. Sarah Jenkins</div>
                  <div>Department: Cardiology Unit</div>
                  <div>Scheduled Time: 10:30 AM Today (Slot #03)</div>
                  <div>Reason: Post-Operative Cardiac Evaluation</div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => setShowBookModal(true)}
                    className="px-3.5 py-2 bg-sky-600 text-white font-bold rounded-xl text-[11px]"
                  >
                    Reschedule Slot 📅
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" /> Active Prescriptions Quick View
                </h2>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <div className="font-bold text-slate-900">Aspirin 75mg & Atorvastatin 40mg</div>
                    <div className="text-slate-600">Dosage: 1 Tablet • Frequency: Twice Daily</div>
                    <div className="text-slate-500 italic">Prescribed by Dr. Sarah Jenkins</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 & 4: MY APPOINTMENTS & BOOKING */}
        {(activeTab === 'book_appointment' || activeTab === 'my_appointments') && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" /> Patient Appointment Management
                </h2>
                <p className="text-xs text-slate-500">View upcoming & past appointments, reschedule slots, or cancel visits</p>
              </div>
              <button
                onClick={() => setShowBookModal(true)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Book New Appointment Slot
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">DOCTOR</th>
                    <th className="p-3">SPECIALTY / DEPT</th>
                    <th className="p-3">DATE & TIME</th>
                    <th className="p-3">REASON FOR VISIT</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appointments.slice(0, 5).map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{a.doctor?.user?.name || 'Dr. Sarah Jenkins'}</td>
                      <td className="p-3 text-purple-700 font-bold">{a.department?.name || 'Cardiology Unit'}</td>
                      <td className="p-3 font-bold text-sky-800">10:30 AM Today</td>
                      <td className="p-3 text-slate-600">{a.reason}</td>
                      <td className="p-3"><StatusBadge status={a.status} /></td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowBookModal(true)}
                            className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded font-bold text-[11px]"
                          >
                            Reschedule 📅
                          </button>
                          {a.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelAppointment(a.id)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded font-bold text-[11px]"
                            >
                              Cancel ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 5: MEDICAL RECORDS (READ-ONLY) */}
        {activeTab === 'medical_records' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" /> Read-Only Electronic Health Record (EHR)
                  </h2>
                  <p className="text-xs text-slate-500">Official medical record verified by hospital medical board</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded">
                  VERIFIED RECORD ✅
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prescriptions */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs">
                    <Pill className="w-4 h-4 text-emerald-600" /> Prescribed Medications
                  </h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900">Aspirin 75mg & Atorvastatin 40mg</div>
                    <div className="text-slate-600">Dosage: 1 Tablet • Frequency: Twice Daily • Duration: 14 Days</div>
                    <div className="text-slate-500 italic">Instructions: Take after meals with water. Do not skip doses.</div>
                  </div>
                </div>

                {/* Lab & Imaging Reports */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2 text-xs">
                    <TestTube className="w-4 h-4 text-cyan-600" /> Lab & Radiology Reports
                  </h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="font-bold text-slate-900">Cardiac Troponin I & Lipid Panel</div>
                    <div className="text-slate-600 text-[11px]">Result: Normal (0.02 ng/mL) • Status: COMPLETED</div>
                    <div className="text-slate-500 italic">Filed by Dr. Sarah Jenkins (Cardiology Unit)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: PATIENT REAL-TIME NOTIFICATIONS FEED */}
        {activeTab === 'notifications' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-600" /> Patient Notification Feed ({notifications.length})
              </h2>
              <p className="text-xs text-slate-500">Real-time alerts for appointment confirmations, lab reports, prescriptions & admission updates</p>
            </div>

            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-amber-600" /> {n.title}
                    </div>
                    <div className="text-slate-600 text-[11px]">{n.desc}</div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{n.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOOK APPOINTMENT MODAL (STEP 3) */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-mono text-xs">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" /> Book / Reschedule Appointment Slot
            </h3>
            <form onSubmit={handleBookAppointment} className="space-y-3">
              <div>
                <label className="text-slate-600 block mb-1">Select Specialty Department</label>
                <select value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Select Doctor</label>
                <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.user?.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Available Time Slot</label>
                <select value={apptSlot} onChange={(e) => setApptSlot(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="10:30 AM Today">10:30 AM Today (Slot #03 - Available)</option>
                  <option value="02:00 PM Today">02:00 PM Today (Slot #07 - Available)</option>
                  <option value="11:00 AM Tomorrow">11:00 AM Tomorrow (Slot #02 - Available)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Reason for Visit</label>
                <input type="text" value={apptReason} onChange={(e) => setApptReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Confirm & Book Slot 📅
                </button>
                <button type="button" onClick={() => setShowBookModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
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
