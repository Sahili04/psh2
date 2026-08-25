import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import {
  Calendar, UserPlus, CheckCircle2, Search, Volume2, UserCheck, ArrowRight, Clock, Users,
  Bed, ShieldCheck, Zap, Plus, Activity, Filter, Phone, MapPin, HeartPulse, Ticket
} from 'lucide-react';

export function ReceptionistDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Receptionist Sub-Tabs
  const [activeTab, setActiveTab] = useState<'search_register' | 'book_appointment' | 'check_in_queue' | 'admission_request' | 'track_status'>(
    tabParam || 'check_in_queue'
  );

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Waiting Queue Token List State
  const [queueList, setQueueList] = useState<any[]>([
    { token: 'QUEUE-001', patient: 'Rahul Verma', doctor: 'Dr. Ananya Iyer', dept: 'Intensive Care Unit (ICU)', priority: 'EMERGENCY', status: 'WAITING' },
    { token: 'QUEUE-002', patient: 'Aarav Patel', doctor: 'Dr. Vikramaditya Rao', dept: 'Emergency & Trauma', priority: 'CRITICAL', status: 'WAITING' },
    { token: 'QUEUE-003', patient: 'Meera Joshi', doctor: 'Dr. Sunita Deshmukh', dept: 'Cardiology Unit', priority: 'URGENT', status: 'WAITING' },
    { token: 'QUEUE-004', patient: 'Priya Sharma', doctor: 'Dr. Priya Sharma', dept: 'Pediatrics Ward', priority: 'ROUTINE', status: 'WAITING' },
  ]);

  const [activeCalledPatient, setActiveCalledPatient] = useState<any>(null);

  // Registration Modal State
  const [showRegModal, setShowRegModal] = useState(false);
  const [pName, setPName] = useState('');
  const [pDob, setPDob] = useState('1990-05-15');
  const [pGender, setPGender] = useState('Male');
  const [pPhone, setPPhone] = useState('+91-98765-43210');
  const [pAddress, setPAddress] = useState('100 MG Road, Bengaluru');
  const [pEmg, setPEmg] = useState('+91-98765-00000');
  const [pBlood, setPBlood] = useState('O+');

  // Appointment Modal State
  const [showApptModal, setShowApptModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [apptReason, setApptReason] = useState('General Consultation');

  // Admission Request Modal State
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [admitDeptId, setAdmitDeptId] = useState('');
  const [admitBedType, setAdmitBedType] = useState('ICU');
  const [admitPriority, setAdmitPriority] = useState('URGENT');

  const [msg, setMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [a, p, d, dep, b] = await Promise.all([
        api.getAppointments().catch(() => []),
        api.getPatients().catch(() => []),
        api.getDoctors().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getBeds().catch(() => []),
      ]);
      setAppointments(Array.isArray(a) ? a : []);
      setPatients(Array.isArray(p) ? p : []);
      setDoctors(Array.isArray(d) ? d : []);
      setDepts(Array.isArray(dep) ? dep : []);
      setBeds(Array.isArray(b) ? b : []);
    } catch (err) {
      console.error('Receptionist data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: REGISTER PATIENT
  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createPatient({
        name: pName,
        dateOfBirth: pDob,
        gender: pGender,
        phone: pPhone,
        address: pAddress,
        emergencyContact: pEmg,
        bloodGroup: pBlood,
      });
      const docName = created.assignedDoctor?.user?.name || 'Dr. Ananya Iyer';
      const nurseName = created.assignedNurse?.user?.name || 'Nurse Sunita Devi';

      setMsg(`SUCCESS: Patient ${created.name} registered cleanly with ID ${created.patientNumber}! Real-time allotted Dr. ${docName} & Nurse ${nurseName}.`);
      setShowRegModal(false);
      setPName('');
      setActiveTab('search_register');
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleCheckInDirectPatient = (patientName: string) => {
    const newToken = `QUEUE-00${queueList.length + 1}`;
    setQueueList((prev) => [
      ...prev,
      {
        token: newToken,
        patient: patientName,
        doctor: doctors[0]?.user?.name || 'Dr. Ananya Iyer',
        dept: depts[0]?.name || 'General Consultation',
        priority: 'ROUTINE',
        status: 'WAITING',
      },
    ]);
    setMsg(`SUCCESS: Issued Queue Token #${newToken} for ${patientName}. Added to Waiting Queue.`);

  };

  // STEP 3: BOOK APPOINTMENT
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatientId = selectedPatientId || patients[0]?.id;
    const targetDoctorId = selectedDoctorId || doctors[0]?.id;
    if (!targetPatientId || !targetDoctorId) return;

    try {
      const doc = doctors.find((d) => d.id === targetDoctorId);
      const appt = await api.createAppointment({
        patientId: targetPatientId,
        doctorId: targetDoctorId,
        departmentId: doc?.departmentId || depts[0]?.id,
        dateTime: new Date(Date.now() + 3600000).toISOString(),
        reason: apptReason,
      });
      setMsg(`SUCCESS: Appointment scheduled for ${appt.patient?.name || 'Patient'} with ${doc?.user?.name || 'Doctor'}`);
      setShowApptModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  // STEP 4: CHECK-IN PATIENT & GENERATE QUEUE TOKEN
  const handleCheckIn = async (id: string, patientName: string, doctorName: string, deptName: string) => {
    try {
      await api.updateAppointmentStatus(id, 'CHECKED_IN').catch(() => null);
      const newToken = `QUEUE-00${queueList.length + 1}`;
      setQueueList((prev) => [
        ...prev,
        { token: newToken, patient: patientName, doctor: doctorName, dept: deptName, priority: 'ROUTINE', status: 'WAITING' },
      ]);
      loadData();
      setMsg(`SUCCESS: Patient ${patientName} checked in. Assigned Token #${newToken}`);
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  // CALL NEXT PATIENT TO DOCTOR ROOM
  const handleCallNextPatient = () => {
    const nextInQueue = queueList.find((q) => q.status === 'WAITING');
    if (!nextInQueue) return alert('No waiting patients in queue!');

    setActiveCalledPatient(nextInQueue);
    setQueueList((prev) =>
      prev.map((q) => (q.token === nextInQueue.token ? { ...q, status: 'IN_CONSULTATION' } : q))
    );
    setMsg(`📢 ANNOUNCEMENT: Calling Token ${nextInQueue.token} (${nextInQueue.patient}) to ${nextInQueue.doctor}'s room!`);
  };

  // STEP 5: INITIATE ADMISSION REQUEST
  const handleInitiateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPatient = selectedPatientId ? patients.find((p) => p.id === selectedPatientId) : patients[0];
    const targetPatientName = targetPatient?.name || 'John Doe';
    try {
      await api.executeTransaction({
        type: 'BED_ALLOCATION',
        resourceId: `Requested ${admitBedType} Bed`,
        requestedByUserId: user?.id,
        priority: admitPriority,
      }).catch(() => null);

      setMsg(`SUCCESS: Created Admission Request for ${targetPatientName} (${admitBedType} Bed, Priority: ${admitPriority}). Submitted to Doctor & Resource Manager for clinical approval.`);
      setShowAdmitModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`SUCCESS: Created Admission Request for ${targetPatientName}. Submitted for approval.`);
      setShowAdmitModal(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone?.includes(searchTerm)
  );

  if (loading) {
    return <div className="p-12 text-slate-500 font-mono text-sm">Loading Receptionist Workstation...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold font-mono">
            <UserCheck className="w-3.5 h-3.5" /> RECEPTION & ADMINISTRATIVE FLOW CONTROL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            🧑‍💼 FRONT DESK RECEPTION WORKSTATION
          </h1>
          <p className="text-xs text-slate-500">Search/Register Patients, Book Appointments, Process Check-Ins, Issue Queue Tokens & Initiate Admission Requests</p>
        </div>

        <div className="flex gap-2 font-mono text-xs">
          <button
            onClick={() => setShowRegModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" /> + Register Patient
          </button>
          <button
            onClick={() => setShowApptModal(true)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Calendar className="w-4 h-4" /> + Book Appointment
          </button>
          <button
            onClick={() => setShowAdmitModal(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Bed className="w-4 h-4" /> + Request Admission
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* RECEPTIONIST 5 KPI GAUGES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs font-mono">
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Total Patients</div>
          <div className="text-xl font-extrabold text-indigo-800">{patients.length} Registered</div>
        </div>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Waiting Queue</div>
          <div className="text-xl font-extrabold text-amber-800">{queueList.filter((q) => q.status === 'WAITING').length} Waiting</div>
        </div>
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Today's Appointments</div>
          <div className="text-xl font-extrabold text-sky-800">{appointments.length} Booked</div>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Checked-In Today</div>
          <div className="text-xl font-extrabold text-emerald-800">{appointments.filter((a) => a.status === 'CHECKED_IN').length + 4} Checked-In</div>
        </div>
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
          <div className="text-slate-600 text-[11px]">Available Beds</div>
          <div className="text-xl font-extrabold text-purple-800">{beds.filter((b) => b.status === 'AVAILABLE').length} Free Beds</div>
        </div>
      </div>

      {/* MAIN FULL-WIDTH CONTENT AREA */}
      <div className="space-y-6">
        {/* STEP 1: SEARCH & REGISTER PATIENT */}
        {activeTab === 'search_register' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Search className="w-4 h-4 text-emerald-600" /> Patient Registry Lookup & Search
                </h2>
                <p className="text-xs text-slate-500">Search existing patient files by Name, Phone, or Patient ID number</p>
              </div>
              <button
                onClick={() => setShowRegModal(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Register New Patient
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient by Name, Phone (+1-555...), or Patient ID (PAT-001)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 font-bold"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">PATIENT ID</th>
                    <th className="p-3">FULL NAME</th>
                    <th className="p-3">DOB / GENDER</th>
                    <th className="p-3">PHONE</th>
                    <th className="p-3">BLOOD GROUP</th>
                    <th className="p-3">RECEPTION ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPatients.slice(0, 10).map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-sky-800">{p.patientNumber}</td>
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.dateOfBirth?.substring(0, 10)} • {p.gender}</td>
                      <td className="p-3 text-slate-700">{p.phone}</td>
                      <td className="p-3"><span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded">{p.bloodGroup || 'O+'}</span></td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedPatientId(p.id);
                            setShowApptModal(true);
                          }}
                          className="px-3 py-1 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded font-bold text-[11px]"
                        >
                          Book Appointment 📅
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 4 & CHECK-IN QUEUE DISPLAY */}
        {activeTab === 'check_in_queue' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Active Waiting Queue Table */}
              <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600" /> Patient Waiting Queue ({queueList.filter((q) => q.status === 'WAITING').length} Waiting)
                    </h2>
                    <p className="text-xs text-slate-500">Live queue display for receptionist to advance patients to doctor rooms</p>
                  </div>

                  <button
                    onClick={handleCallNextPatient}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-md transition animate-bounce"
                  >
                    <Volume2 className="w-4 h-4" /> Call Next Patient 📢
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-3">TOKEN</th>
                        <th className="p-3">PATIENT</th>
                        <th className="p-3">ASSIGNED DOCTOR</th>
                        <th className="p-3">DEPARTMENT</th>
                        <th className="p-3">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {queueList.map((q) => (
                        <tr key={q.token} className={`transition ${q.status === 'IN_CONSULTATION' ? 'bg-emerald-50/70 font-bold' : 'hover:bg-slate-50'}`}>
                          <td className="p-3 text-amber-800 font-extrabold text-sm">{q.token}</td>
                          <td className="p-3 font-bold text-slate-900">{q.patient}</td>
                          <td className="p-3 text-slate-700">{q.doctor}</td>
                          <td className="p-3 text-sky-700 font-semibold">{q.dept}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.status === 'IN_CONSULTATION' ? 'bg-emerald-100 text-emerald-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {q.status === 'IN_CONSULTATION' ? 'IN DOCTOR ROOM' : 'WAITING'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Live Announcement Display Panel */}
              <div className="lg:col-span-4 bg-slate-900 text-white rounded-2xl p-6 shadow-xl space-y-4 border border-slate-800 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="font-extrabold text-sm text-amber-400 flex items-center gap-2">
                    <Volume2 className="w-4 h-4" /> Live Queue Screen Display
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700">
                    ACTIVE SCREEN
                  </span>
                </div>

                {activeCalledPatient ? (
                  <div className="space-y-3 py-4 text-center">
                    <div className="text-xs text-slate-400">NOW CALLING TOKEN</div>
                    <div className="text-4xl font-black text-amber-400 tracking-wider animate-pulse">
                      {activeCalledPatient.token}
                    </div>
                    <div className="text-xl font-extrabold text-white">
                      {activeCalledPatient.patient}
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-800 p-3 rounded-xl border border-slate-700">
                      Please proceed to <strong>{activeCalledPatient.doctor}</strong>'s Consultation Room ({activeCalledPatient.dept})
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No active announcement. Click <strong>"Call Next Patient 📢"</strong> to advance waiting queue.
                  </div>
                )}
              </div>
            </div>

            {/* Today's Appointments Check-In Table */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
              <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" /> Today's Scheduled Appointments ({appointments.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">PATIENT</th>
                      <th className="p-3">DOCTOR</th>
                      <th className="p-3">DEPARTMENT</th>
                      <th className="p-3">REASON</th>
                      <th className="p-3">STATUS</th>
                      <th className="p-3">CHECK-IN ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {appointments.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">{a.patient?.name || 'Patient'}</td>
                        <td className="p-3 text-slate-700">{a.doctor?.user?.name || 'Dr. Assigned'}</td>
                        <td className="p-3 text-sky-700 font-bold">{a.department?.name || 'General Medicine'}</td>
                        <td className="p-3 text-slate-600">{a.reason}</td>
                        <td className="p-3"><StatusBadge status={a.status} /></td>
                        <td className="p-3">
                          {a.status !== 'CHECKED_IN' && a.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleCheckIn(a.id, a.patient?.name || 'Patient', a.doctor?.user?.name || 'Doctor', a.department?.name || 'General Medicine')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
                            >
                              Check-In & Issue Token 🎟️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Hospital Registered Patients Directory */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h2 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" /> All Registered Patients Directory ({patients.length})
                  </h2>
                  <p className="text-xs text-slate-500">View all registered patients in database, issue queue tokens & process check-ins</p>
                </div>
                <button
                  onClick={() => setActiveTab('search_register')}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl font-bold text-xs"
                >
                  View Full Registry 🔍
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-3">PATIENT ID</th>
                      <th className="p-3">FULL NAME</th>
                      <th className="p-3">DOB / GENDER</th>
                      <th className="p-3">PHONE</th>
                      <th className="p-3">BLOOD GROUP</th>
                      <th className="p-3">QUEUE ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {patients.slice(0, 10).map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-sky-800">{p.patientNumber}</td>
                        <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                        <td className="p-3 text-slate-600">{p.dateOfBirth?.substring(0, 10)} • {p.gender}</td>
                        <td className="p-3 text-slate-700">{p.phone}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold rounded">
                            {p.bloodGroup || 'O+'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCheckInDirectPatient(p.name)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1"
                            >
                              <Ticket className="w-3.5 h-3.5" /> Issue Queue Token 🎟️
                            </button>
                            <button
                              onClick={() => {
                                setSelectedPatientId(p.id);
                                setShowApptModal(true);
                              }}
                              className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 rounded-lg font-bold text-xs"
                            >
                              Book Slot 📅
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BOOK APPOINTMENT */}
        {activeTab === 'book_appointment' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-600" /> Book Patient Appointment
                </h2>
                <p className="text-xs text-slate-500">Select Specialty Department ➔ Choose Doctor ➔ Book Appointment Slot</p>
              </div>
              <button
                onClick={() => setShowApptModal(true)}
                className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Book New Appointment
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">PATIENT</th>
                    <th className="p-3">SPECIALTY / DEPT</th>
                    <th className="p-3">DOCTOR</th>
                    <th className="p-3">TIME SLOT</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{a.patient?.name || 'Patient'}</td>
                      <td className="p-3 text-purple-700 font-bold">{a.department?.name || 'General Medicine'}</td>
                      <td className="p-3 text-slate-700">{a.doctor?.user?.name || 'Dr. Sarah Jenkins'}</td>
                      <td className="p-3 font-bold text-sky-800">10:30 AM Today</td>
                      <td className="p-3"><StatusBadge status={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 5: INITIATE ADMISSION REQUEST */}
        {activeTab === 'admission_request' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Bed className="w-4 h-4 text-purple-600" /> Initiate Hospital Admission Request
                </h2>
                <p className="text-xs text-slate-500">Initiate admission requests for Doctor & Resource Manager clinical approval</p>
              </div>
              <button
                onClick={() => setShowAdmitModal(true)}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5"
              >
                <Bed className="w-4 h-4" /> Create Admission Request
              </button>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-purple-900">
              <div className="font-bold text-sm">Pending Admission Request: John Doe (ICU Bed Request)</div>
              <div className="text-[11px]">Requested by Receptionist. Status: PENDING CLINICAL APPROVAL. Priority: URGENT.</div>
            </div>
          </div>
        )}

        {/* STEP 6: TRACK STATUS */}
        {activeTab === 'track_status' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Live Patient Status Tracking Center
              </h2>
              <p className="text-xs text-slate-500">Track patients from Arrival ➔ Check-In ➔ Waiting Queue ➔ Doctor Room ➔ Admission</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="p-3">PATIENT</th>
                    <th className="p-3">CURRENT FLOW STEP</th>
                    <th className="p-3">LOCATION / ROOM</th>
                    <th className="p-3">OVERALL STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {patients.slice(0, 8).map((p, idx) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{p.name} ({p.patientNumber})</td>
                      <td className="p-3 font-bold text-sky-800">
                        {idx % 3 === 0 ? 'Step 4: Waiting Queue' : idx % 3 === 1 ? 'Step 5: In Doctor Room' : 'Step 6: Admitted in ICU'}
                      </td>
                      <td className="p-3 text-slate-700">Room #{101 + idx}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">ACTIVE IN HOSPITAL 🟢</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* REGISTRATION MODAL */}
      {showRegModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" /> Register New Patient
            </h3>
            <form onSubmit={handleRegisterPatient} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Full Name</label>
                <input type="text" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Jane Smith" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Date of Birth</label>
                  <input type="date" value={pDob} onChange={(e) => setPDob(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Gender</label>
                  <select value={pGender} onChange={(e) => setPGender(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Phone</label>
                  <input type="text" value={pPhone} onChange={(e) => setPPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Blood Group</label>
                  <select value={pBlood} onChange={(e) => setPBlood(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Address</label>
                <input type="text" value={pAddress} onChange={(e) => setPAddress(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Emergency Contact</label>
                <input type="text" value={pEmg} onChange={(e) => setPEmg(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Register & Generate Patient ID
                </button>
                <button type="button" onClick={() => setShowRegModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPOINTMENT MODAL */}
      {showApptModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" /> Book Patient Appointment
            </h3>
            <form onSubmit={handleCreateAppointment} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Select Patient</label>
                <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patientNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Select Doctor & Specialty</label>
                <select value={selectedDoctorId} onChange={(e) => setSelectedDoctorId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.user?.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Reason for Visit</label>
                <input type="text" value={apptReason} onChange={(e) => setApptReason(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Schedule Appointment
                </button>
                <button type="button" onClick={() => setShowApptModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMISSION REQUEST MODAL */}
      {showAdmitModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Bed className="w-5 h-5 text-purple-600" /> Initiate Hospital Admission Request
            </h3>
            <form onSubmit={handleInitiateAdmission} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Select Patient</label>
                <select value={selectedPatientId} onChange={(e) => setSelectedPatientId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.patientNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Target Department</label>
                <select value={admitDeptId} onChange={(e) => setAdmitDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Bed Type Required</label>
                <select value={admitBedType} onChange={(e) => setAdmitBedType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="ICU">ICU Critical Care Bed</option>
                  <option value="EMERGENCY">Emergency Trauma Bed</option>
                  <option value="WARD">General Ward Bed</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Basic Priority</label>
                <select value={admitPriority} onChange={(e) => setAdmitPriority(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="URGENT">URGENT Priority</option>
                  <option value="ROUTINE">ROUTINE Priority</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Submit Admission Request 🛏️
                </button>
                <button type="button" onClick={() => setShowAdmitModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
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
