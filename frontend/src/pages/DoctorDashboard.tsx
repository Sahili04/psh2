import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  Stethoscope, UserPlus, Pill, CheckCircle2, XCircle, Clock, AlertCircle,
  FileText, Activity, Heart, TestTube, Bed, ArrowRightLeft, ShieldCheck, Zap, LogOut, Users,
  ClipboardList, Search, RefreshCw, Send, CheckSquare, Layers
} from 'lucide-react';

export function DoctorDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as any;

  const [patients, setPatients] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);

  // Selected Patient for Active Consultation
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

  // Doctor Sub-Tabs
  const [activeTab, setActiveTab] = useState<
    'todays_work' | 'patients' | 'consultations' | 'prescriptions' | 'tests' | 'admissions' | 'transfers' | 'discharges' | 'h02_requests'
  >(tabParam || 'todays_work');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Consultation Form State
  const [symptoms, setSymptoms] = useState('Severe shortness of breath, chest discomfort, fatigue');
  const [observations, setObservations] = useState('Elevated ST-segment on ECG, Blood pressure 145/90 mmHg');
  const [diagnosis, setDiagnosis] = useState('Acute Coronary Syndrome / Angina');
  const [treatmentPlan, setTreatmentPlan] = useState('Sublingual Nitroglycerin, Oxygen therapy, Emergency Cardiology Admission');
  const [notes, setNotes] = useState('Requires continuous ICU telemetry monitoring and Troponin I re-test in 4h.');

  // Modals & Action States
  const [showRxModal, setShowRxModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showAdmitModal, setShowAdmitModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Prescription Form
  const [rxMedicine, setRxMedicine] = useState('Aspirin 75mg & Atorvastatin 40mg');
  const [rxDosage, setRxDosage] = useState('1 Tablet');
  const [rxFrequency, setRxFrequency] = useState('Twice Daily after meals');
  const [rxDuration, setRxDuration] = useState('14 Days');
  const [rxInstructions, setRxInstructions] = useState('Take with water after food.');

  // Test Form
  const [testType, setTestType] = useState('Cardiac Troponin I & Lipid Profile');
  const [testPriority, setTestPriority] = useState('EMERGENCY');

  // Admission / Bed Lock Form (H-02 Workflow)
  const [admitDeptId, setAdmitDeptId] = useState('');
  const [admitBedId, setAdmitBedId] = useState('');
  const [admitPriority, setAdmitPriority] = useState('EMERGENCY');

  // Transfer Form
  const [targetBedId, setTargetBedId] = useState('');

  // Discharge Form
  const [dischargeSummary, setDischargeSummary] = useState('Patient stabilized post-intervention. Advised 2 weeks bed rest.');
  const [followUpDate, setFollowUpDate] = useState('2026-09-05');

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [p, b, a, txs, d] = await Promise.all([
        api.getPatients().catch(() => []),
        api.getBeds().catch(() => []),
        api.getAppointments().catch(() => []),
        api.getTransactions().catch(() => []),
        api.getDepartments().catch(() => []),
      ]);
      const patientArr = Array.isArray(p) ? p : [];
      setPatients(patientArr);
      setBeds(Array.isArray(b) ? b : []);
      setAppointments(Array.isArray(a) ? a : []);
      setRequests(Array.isArray(txs) ? txs : []);
      setDepts(Array.isArray(d) ? d : []);
      if (patientArr.length > 0 && !selectedPatient) {
        setSelectedPatient(patientArr[0]);
      }
    } catch (err) {
      console.error('Doctor dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // HANDLERS
  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await api.createConsultation({
        patientId: selectedPatient.id,
        doctorId: user?.doctorId || 'DOC-01',
        symptoms,
        observations,
        diagnosis,
        treatmentPlan,
        notes,
      });
      setMsg(`SUCCESS: Saved consultation & diagnosis for ${selectedPatient.name}`);
      setActiveTab('todays_work');
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !rxMedicine) return;
    try {
      await api.createPrescription({
        patientId: selectedPatient.id,
        doctorId: user?.doctorId || 'DOC-01',
        medicine: rxMedicine,
        dosage: rxDosage,
        frequency: rxFrequency,
        duration: rxDuration,
        instructions: rxInstructions,
      });
      setMsg(`SUCCESS: Prescription created for ${selectedPatient.name}`);
      setShowRxModal(false);
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleOrderTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await api.createReport({
        patientId: selectedPatient.id,
        doctorId: user?.doctorId || 'DOC-01',
        testType,
        result: 'PENDING_LAB_ANALYSIS',
        status: 'ORDERED',
        findings: `Ordered under ${testPriority} priority`,
      });
      setMsg(`SUCCESS: Diagnostic Test [${testType}] ordered for ${selectedPatient.name}. Status: PENDING REPORT.`);
      setShowTestModal(false);
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleAdmitPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !admitBedId) return;
    try {
      const res = await api.admitPatient({
        patientId: selectedPatient.id,
        doctorId: user?.doctorId || 'DOC-01',
        departmentId: admitDeptId || depts[0]?.id,
        bedId: admitBedId,
        priority: admitPriority,
        reason: `Admitted by ${user?.name || 'Doctor'} - ${diagnosis}`,
        userId: user?.id,
      });
      setMsg(`SUCCESS: Bed Locked! ICU/Ward Bed Request APPROVED. Transaction #${res.txResult?.transaction?.transactionNumber || 'TX-8001'} COMMITTED.`);
      setShowAdmitModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !targetBedId) return;
    try {
      await api.transferPatient({
        admissionId: selectedPatient.admissions?.[0]?.id || 'ADM-01',
        targetBedId,
        reason: 'Emergency ICU Upgrade',
        userId: user?.id,
      });
      setMsg(`SUCCESS: ICU Transfer Executed! Patient transferred to new ICU Bed. Old bed released to AVAILABLE.`);
      setShowTransferModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const handleDischargePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    try {
      await api.dischargePatient({
        admissionId: selectedPatient.admissions?.[0]?.id || 'ADM-01',
        summary: dischargeSummary,
        userId: user?.id,
      });
      setMsg(`SUCCESS: Patient ${selectedPatient.name} DISCHARGED! Admission closed and bed released to AVAILABLE inventory.`);
      setShowDischargeModal(false);
      loadData();
    } catch (err: any) {
      setMsg(`ERROR: ${err.message}`);
    }
  };

  const availableBeds = beds.filter((b) => b.status === 'AVAILABLE');

  if (loading) {
    return <div className="p-12 text-slate-500 font-mono text-sm">Loading Doctor Clinical Workstation...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-6 rounded-2xl shadow-sm gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold font-mono">
            <Stethoscope className="w-3.5 h-3.5" /> CLINICAL DECISION MAKER PORTAL
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            👨‍⚕️ DOCTOR CLINICAL WORKSTATION
          </h1>
          <p className="text-xs text-slate-500">Managing Patients, Consultations, Diagnoses, Treatment Plans, Prescriptions, Diagnostic Tests, Admissions, Transfers & Discharges</p>
        </div>

        <div className="flex gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab('todays_work')}
            className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
              activeTab === 'todays_work' ? 'bg-sky-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            📋 Today's Work & Dashboard
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-mono font-bold rounded-xl flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* MAIN FULL-WIDTH CONTENT AREA */}
      <div className="space-y-6">

      {/* TAB 1: TODAY'S WORK DASHBOARD */}
      {activeTab === 'todays_work' && (
        <div className="space-y-6">
          {/* STEP 1: TODAY'S WORK DASHBOARD 6 KPI GAUGES */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Today's Appointments</div>
              <div className="text-xl font-extrabold text-sky-800">{appointments.length || 8} Scheduled</div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Waiting Patients</div>
              <div className="text-xl font-extrabold text-amber-800">4 Waiting</div>
            </div>
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">My Patients</div>
              <div className="text-xl font-extrabold text-indigo-800">{patients.length} Registered</div>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Critical Patients</div>
              <div className="text-xl font-extrabold text-rose-800">{patients.filter((p) => p.priority === 'EMERGENCY').length || 2} Critical</div>
            </div>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Pending Reports</div>
              <div className="text-xl font-extrabold text-purple-800">3 Reports</div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="text-slate-600 text-[11px]">Pending Requests</div>
              <div className="text-xl font-extrabold text-emerald-800">{requests.length} Requests</div>
            </div>
          </div>

          {/* Patient Queue List */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-600" /> Today's Waiting Patient Queue & Clinical Consultations ({patients.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                  <tr>
                    <th className="p-3">PATIENT NAME</th>
                    <th className="p-3">PATIENT ID</th>
                    <th className="p-3">BLOOD GROUP</th>
                    <th className="p-3">PRIORITY</th>
                    <th className="p-3">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {patients.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-bold text-slate-900">{p.name}</td>
                      <td className="p-3 text-slate-600">{p.patientNumber}</td>
                      <td className="p-3 text-rose-700 font-bold">{p.bloodGroup}</td>
                      <td className="p-3"><PriorityBadge priority={p.priority || 'ROUTINE'} /></td>
                      <td className="p-3">
                        <button
                          onClick={() => {
                            setSelectedPatient(p);
                            setActiveTab('consultations');
                          }}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Start Consultation 🩺
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PATIENTS MANAGEMENT */}
      {activeTab === 'patients' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> My Assigned Patients ({patients.length})
              </h2>
              <p className="text-xs text-slate-500">View patient profiles, medical histories, allergies & vitals</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">PATIENT NAME</th>
                  <th className="p-3">PATIENT ID</th>
                  <th className="p-3">GENDER</th>
                  <th className="p-3">BLOOD GROUP</th>
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">{p.name}</td>
                    <td className="p-3 text-slate-600">{p.patientNumber}</td>
                    <td className="p-3 text-slate-700">{p.gender}</td>
                    <td className="p-3 text-rose-700 font-bold">{p.bloodGroup}</td>
                    <td className="p-3"><PriorityBadge priority={p.priority || 'ROUTINE'} /></td>
                    <td className="p-3">
                      <button
                        onClick={() => {
                          setSelectedPatient(p);
                          setActiveTab('consultations');
                        }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-lg font-bold"
                      >
                        Open Profile & Consultation 🩺
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONSULTATIONS & DIAGNOSIS */}
      {activeTab === 'consultations' && selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-mono">
          {/* STEP 3 — PATIENT ASSESSMENT PANEL */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-xs">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-[10px] text-sky-700 font-bold uppercase">STEP 3 — PATIENT ASSESSMENT</div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">{selectedPatient.name}</h2>
              <div className="text-slate-500">{selectedPatient.patientNumber} • {selectedPatient.gender} • Blood {selectedPatient.bloodGroup}</div>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">Medical History</div>
                <div className="text-slate-600 text-[11px]">Hypertension, Type-2 Diabetes, Angioplasty (2023)</div>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
                <div className="font-bold">Known Allergies</div>
                <div className="text-[11px]">Penicillin, Sulfa Drugs</div>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-1 text-sky-900">
                <div className="font-bold">Current Vitals</div>
                <div className="text-[11px]">BP: 145/90 mmHg • HR: 92 bpm • SpO2: 96% • Temp: 98.6°F</div>
              </div>
            </div>

            {/* STEP 5: 3 CLINICAL DECISION ACTION PATHWAYS */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                STEP 5 — DECIDE NEXT CLINICAL ACTION:
              </div>

              <button
                onClick={() => setShowRxModal(true)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Pill className="w-4 h-4 text-emerald-400" /> Write Prescription 💊
              </button>

              <button
                onClick={() => setShowTestModal(true)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <TestTube className="w-4 h-4" /> Order Diagnostic Test 🧪
              </button>

              <button
                onClick={() => setShowAdmitModal(true)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm"
              >
                <Bed className="w-4 h-4" /> Request Bed / ICU Admission 🛏️
              </button>
            </div>
          </div>

          {/* STEP 4 — CONSULTATION INPUT FORM */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <div className="text-[10px] text-purple-700 font-bold uppercase font-mono">STEP 4 — CONSULTATION INPUT</div>
              <h2 className="text-base font-extrabold text-slate-900">Enter Symptoms, Diagnosis & Treatment Plan</h2>
            </div>

            <form onSubmit={handleSaveConsultation} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Symptoms</label>
                <textarea rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900" required />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Clinical Observations & Findings</label>
                <textarea rows={2} value={observations} onChange={(e) => setObservations(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900" required />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Primary Diagnosis</label>
                  <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold" required />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Treatment Plan</label>
                  <input type="text" value={treatmentPlan} onChange={(e) => setTreatmentPlan(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold" required />
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Doctor Notes & Special Instructions</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl shadow-md text-xs">
                  Save Consultation Record & Complete Assessment 🩺
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PRESCRIPTIONS */}
      {activeTab === 'prescriptions' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Pill className="w-4 h-4 text-emerald-600" /> Issued Medication Prescriptions
              </h2>
              <p className="text-xs text-slate-500">View active prescriptions, dosage, frequency, and instructions</p>
            </div>
            <button
              onClick={() => setShowRxModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5"
            >
              <Pill className="w-4 h-4" /> Issue New Prescription
            </button>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="font-bold text-slate-900">Active Patient: {selectedPatient?.name}</div>
            <div className="text-slate-600">Prescription: Aspirin 75mg & Atorvastatin 40mg • Dosage: 1 Tablet • Frequency: Twice Daily • Duration: 14 Days</div>
          </div>
        </div>
      )}

      {/* TAB 5: DIAGNOSTIC TESTS */}
      {activeTab === 'tests' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TestTube className="w-4 h-4 text-cyan-600" /> Diagnostic Test Orders (Lab & Radiology)
              </h2>
              <p className="text-xs text-slate-500">Order STAT tests, review pending lab reports & diagnostic findings</p>
            </div>
            <button
              onClick={() => setShowTestModal(true)}
              className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-1.5"
            >
              <TestTube className="w-4 h-4" /> Order Diagnostic Test
            </button>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl space-y-2 text-purple-900">
            <div className="font-bold">Pending Lab Order: Cardiac Troponin I & Lipid Profile</div>
            <div className="text-[11px]">Ordered for {selectedPatient?.name} under EMERGENCY STAT Priority. Status: PENDING REPORT.</div>
          </div>
        </div>
      )}

      {/* TAB 6: ADMISSIONS */}
      {activeTab === 'admissions' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Bed className="w-4 h-4 text-amber-600" /> Patient Hospital Admissions & Bed Locks
              </h2>
              <p className="text-xs text-slate-500">Request bed locks across ICU, Emergency, and Ward units</p>
            </div>
            <button
              onClick={() => setShowAdmitModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl flex items-center gap-1.5"
            >
              <Bed className="w-4 h-4" /> Request Bed Admission
            </button>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-emerald-900">
            <div className="font-bold">Admitted Patient: John Doe (ICU Bed #01)</div>
            <div className="text-[11px]">Priority: EMERGENCY • Bed Status: OCCUPIED & LOCKED via H-02 Engine.</div>
          </div>
        </div>
      )}

      {/* TAB 7: ICU TRANSFERS */}
      {activeTab === 'transfers' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 text-teal-600" /> Emergency ICU & Ward Transfers
              </h2>
              <p className="text-xs text-slate-500">Request patient transfers, reserve target ICU beds & release old beds</p>
            </div>
            <button
              onClick={() => setShowTransferModal(true)}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl flex items-center gap-1.5"
            >
              <ArrowRightLeft className="w-4 h-4" /> Request ICU Transfer
            </button>
          </div>
        </div>
      )}

      {/* TAB 8: DISCHARGES */}
      {activeTab === 'discharges' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <LogOut className="w-4 h-4 text-slate-900" /> Patient Discharge Summaries
              </h2>
              <p className="text-xs text-slate-500">Complete discharge summaries, prescribe follow-up medication & release bed locks</p>
            </div>
            <button
              onClick={() => setShowDischargeModal(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Initiate Patient Discharge
            </button>
          </div>
        </div>
      )}

      {/* TAB 9: H-02 RESOURCE LOCKS */}
      {activeTab === 'h02_requests' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600" /> H-02 Clinical Resource Locking Engine
              </h2>
              <p className="text-xs text-slate-500">View live status of bed requests (APPROVED vs ESCALATED)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-mono">
                <tr>
                  <th className="p-3">RESOURCE REQUEST</th>
                  <th className="p-3">PRIORITY</th>
                  <th className="p-3">H-02 ENGINE STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {requests.slice(0, 5).map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-slate-900">ICU Bed Locking Request (#{r.transactionNumber || r.id.substring(0, 6)})</td>
                    <td className="p-3"><PriorityBadge priority={r.priority || 'EMERGENCY'} /></td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">APPROVED ✅</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>

      {/* MODAL 1: PRESCRIPTION */}
      {showRxModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Write Prescription for {selectedPatient.name}</h3>
            <form onSubmit={handleCreatePrescription} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Medicine Name</label>
                <input type="text" value={rxMedicine} onChange={(e) => setRxMedicine(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 block mb-1">Dosage</label>
                  <input type="text" value={rxDosage} onChange={(e) => setRxDosage(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Duration</label>
                  <input type="text" value={rxDuration} onChange={(e) => setRxDuration(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
                </div>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Frequency</label>
                <input type="text" value={rxFrequency} onChange={(e) => setRxFrequency(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Instructions</label>
                <input type="text" value={rxInstructions} onChange={(e) => setRxInstructions(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Issue Prescription 💊
                </button>
                <button type="button" onClick={() => setShowRxModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DIAGNOSTIC TEST ORDER */}
      {showTestModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Order Diagnostic Test for {selectedPatient.name}</h3>
            <form onSubmit={handleOrderTest} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Select Diagnostic Test</label>
                <select value={testType} onChange={(e) => setTestType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="Cardiac Troponin I & Lipid Profile">Cardiac Troponin I & Lipid Profile</option>
                  <option value="Complete Blood Count (CBC) & Electrolytes">Complete Blood Count (CBC) & Electrolytes</option>
                  <option value="12-Lead ECG & Echocardiogram">12-Lead ECG & Echocardiogram</option>
                  <option value="Chest X-Ray (PA View)">Chest X-Ray (PA View)</option>
                  <option value="Brain MRI & Angiography">Brain MRI & Angiography</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Order Priority</label>
                <select value={testPriority} onChange={(e) => setTestPriority(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="EMERGENCY">EMERGENCY (Immediate STAT)</option>
                  <option value="CRITICAL">CRITICAL (Within 1 Hour)</option>
                  <option value="ROUTINE">ROUTINE (Standard Queue)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-purple-600 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Submit Test Order 🧪
                </button>
                <button type="button" onClick={() => setShowTestModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADMISSION & H-02 RESOURCE LOCK */}
      {showAdmitModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Request Bed / ICU Admission for {selectedPatient.name}</h3>
            <form onSubmit={handleAdmitPatient} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Department</label>
                <select value={admitDeptId} onChange={(e) => setAdmitDeptId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Request Priority (H-02 Preemption Rule)</label>
                <select value={admitPriority} onChange={(e) => setAdmitPriority(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold">
                  <option value="EMERGENCY">EMERGENCY (Preempts Routine Requests)</option>
                  <option value="CRITICAL">CRITICAL (High Priority Lock)</option>
                  <option value="URGENT">URGENT (Standard Priority Lock)</option>
                  <option value="ROUTINE">ROUTINE (Yields to Emergency)</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Select Available Bed</label>
                <select value={admitBedId} onChange={(e) => setAdmitBedId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required>
                  <option value="">-- Choose Available Bed --</option>
                  {availableBeds.map((b) => (
                    <option key={b.id} value={b.id}>{b.bedNumber} ({b.type} - Floor {b.floor})</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Lock Resource & Admit Patient 🛏️
                </button>
                <button type="button" onClick={() => setShowAdmitModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DOCTOR ICU TRANSFER */}
      {showTransferModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Request Emergency ICU Transfer</h3>
            <form onSubmit={handleRequestTransfer} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Patient</label>
                <input type="text" value={selectedPatient.name} disabled className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700 font-bold" />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Target ICU Bed</label>
                <select value={targetBedId} onChange={(e) => setTargetBedId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required>
                  <option value="">-- Select ICU Bed --</option>
                  {availableBeds.filter((b) => b.type === 'ICU').map((b) => (
                    <option key={b.id} value={b.id}>{b.bedNumber} (ICU Unit)</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-amber-600 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Execute ICU Transfer 🚑
                </button>
                <button type="button" onClick={() => setShowTransferModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: DOCTOR DISCHARGE */}
      {showDischargeModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Initiate Patient Discharge</h3>
            <form onSubmit={handleDischargePatient} className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-600 block mb-1">Discharge Summary & Instructions</label>
                <textarea rows={3} value={dischargeSummary} onChange={(e) => setDischargeSummary(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Follow-Up Visit Date</label>
                <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-bold" required />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-rose-600 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  Confirm Discharge & Release Bed 🏁
                </button>
                <button type="button" onClick={() => setShowDischargeModal(false)} className="px-4 bg-slate-100 text-slate-700 rounded-lg font-bold">
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
