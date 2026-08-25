import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DUMMY_REQUIRED_HOSPITAL_DOCUMENTS } from '../types';
import {
  Activity, ShieldCheck, Building, Stethoscope, HeartPulse,
  User, UserPlus, ArrowRight, Key, Sparkles, LogIn, ChevronRight,
  Shield, CheckCircle2, Zap, Award, Layers, Search, Clock, FileText, Check, Plus
} from 'lucide-react';

export function Login() {
  const { login, registerPatient } = useAuth();
  const navigate = useNavigate();

  // Navigation View State
  const [view, setView] = useState<'home' | 'patient_login' | 'patient_signup' | 'org_login' | 'register_org' | 'check_status' | 'owner_login'>('home');

  // Org Category Filter: 'ALL' | 'OWNER' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'OTHER'
  const [orgCategory, setOrgCategory] = useState<'ALL' | 'OWNER' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'OTHER'>('ALL');

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Hospital Registration State
  const [hospName, setHospName] = useState('');
  const [hospRegNum, setHospRegNum] = useState('');
  const [hospEmail, setHospEmail] = useState('');
  const [hospPhone, setHospPhone] = useState('+1-800-HOSPITAL');
  const [hospAddress, setHospAddress] = useState('750 Emergency Expressway');
  const [hospCity, setHospCity] = useState('Metropolis');
  const [hospType, setHospType] = useState('MULTI_SPECIALTY');
  const [superAdminName, setSuperAdminName] = useState('');
  const [superAdminEmail, setSuperAdminEmail] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [attachedDocs, setAttachedDocs] = useState<Record<string, boolean>>({
    'DOC-01': true,
    'DOC-02': true,
    'DOC-03': true,
    'DOC-04': true,
    'DOC-05': true,
    'DOC-06': true,
    'DOC-07': true,
    'DOC-08': true,
  });

  // Application Status Checker State
  const [statusQuery, setStatusQuery] = useState('');
  const [statusResult, setStatusResult] = useState<any>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Patient Registration State
  const [regName, setRegName] = useState('');
  const [regPatientEmail, setRegPatientEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDob, setRegDob] = useState('1995-04-12');
  const [regGender, setRegGender] = useState('Male');
  const [regPhone, setRegPhone] = useState('+1-555-0188');
  const [regBlood, setRegBlood] = useState('O+');

  const demoAccounts = [
    { category: 'OWNER', role: 'PLATFORM_OWNER', name: 'Software Platform Owner', email: 'owner@hospitalecho.com', pass: 'password123', desc: 'Platform Owner — Approves Hospitals & Provisions Super Admins' },
    { category: 'ADMIN', role: 'SUPER_ADMIN', name: 'Dr. Rajesh Sharma', email: 'superadmin@hospital.com', pass: 'password123', desc: 'Hospital Super Admin — Provisions Dept Admins' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'ICU Dept Admin', email: 'deptadmin@hospital.com', pass: 'password123', desc: 'ICU Department Lead — Provisions Doctors/Nurses' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Emergency Dept Admin', email: 'admin.emergency@hospital.com', pass: 'password123', desc: 'Emergency & Trauma Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Cardiology Dept Admin', email: 'admin.cardiology@hospital.com', pass: 'password123', desc: 'Cardiology Unit Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Neurology Dept Admin', email: 'admin.neurology@hospital.com', pass: 'password123', desc: 'Neurology Department Lead' },

    { category: 'DOCTOR', role: 'DOCTOR', name: 'Dr. Ananya Iyer', email: 'doctor@hospital.com', pass: 'password123', desc: 'ICU Lead — Clinical Decision Maker' },
    { category: 'DOCTOR', role: 'DOCTOR', name: 'Dr. Vikramaditya Rao', email: 'doctor2@hospital.com', pass: 'password123', desc: 'Emergency Medicine Specialist' },
    { category: 'NURSE', role: 'NURSE', name: 'Nurse Sunita Devi', email: 'nurse@hospital.com', pass: 'password123', desc: 'ICU Shift Nurse — Bed Allotments & Vitals' },

    { category: 'OTHER', role: 'RECEPTIONIST', name: 'Reception Manager Ramesh', email: 'reception@hospital.com', pass: 'password123', desc: 'Patient Check-In & Appointments Queue' },
    { category: 'OTHER', role: 'RESOURCE_MANAGER', name: 'Resource Mgr Suresh', email: 'resource@hospital.com', pass: 'password123', desc: 'Beds, Equipment & Priority Conflict Center' },
  ];


  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await login(email, password);
      if (!user || !user.role) {
        throw new Error('Server is currently spinning up. Please try again in 5 seconds.');
      }
      redirectRole(user.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setRegSuccessMsg('');
    try {
      const res = await api.registerOrganization({
        name: hospName,
        registrationNumber: hospRegNum,
        email: hospEmail,
        phone: hospPhone,
        address: hospAddress,
        city: hospCity,
        hospitalType: hospType,
        superAdminName,
        superAdminEmail,
      });
      setRegSuccessMsg(res.message || 'Hospital application submitted successfully! Pending Platform Owner authorization.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Hospital registration failed. Please check registration number.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusQuery) return;
    setStatusLoading(true);
    setStatusError('');
    setStatusResult(null);
    try {
      const res = await api.checkOrganizationStatus(statusQuery);
      setStatusResult(res.organization);
    } catch (err: any) {
      setStatusError(err.message || 'No registered hospital found matching your query.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePatientSelfRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await registerPatient({
        name: regName,
        email: regPatientEmail,
        password: regPassword,
        dateOfBirth: regDob,
        gender: regGender,
        phone: regPhone,
        bloodGroup: regBlood,
      });
      if (!user || !user.role) {
        throw new Error('Server is currently spinning up. Please try again in 5 seconds.');
      }
      redirectRole(user.role);
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMsg('');
  };

  const redirectRole = (role: string) => {
    if (role === 'PLATFORM_OWNER') navigate('/platform-owner');
    else if (role === 'SUPER_ADMIN') navigate('/super-admin');
    else if (role === 'ADMIN' || role === 'DEPARTMENT_ADMIN') navigate('/admin');
    else if (role === 'DOCTOR') navigate('/doctor');
    else if (role === 'NURSE') navigate('/nurse');
    else if (role === 'RECEPTIONIST') navigate('/receptionist');
    else if (role === 'RESOURCE_MANAGER') navigate('/resource-manager');
    else navigate('/patient-portal');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-6 md:p-12 font-sans">
      {/* Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div
          onClick={() => setView('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img src="/logo.png" alt="MediVerse Logo" className="h-12 w-auto object-contain group-hover:scale-105 transition-transform" />
          <div>
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
              MediVerse
            </h1>
            <p className="text-xs text-indigo-700 font-mono tracking-wider font-semibold">MULTI-ORGANIZATION CLINICAL PLATFORM</p>
          </div>
        </div>

        {view !== 'home' && (
          <button
            onClick={() => {
              setView('home');
              setErrorMsg('');
              setRegSuccessMsg('');
            }}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 font-mono"
          >
            ← Back to Homepage
          </button>
        )}
      </header>

      {/* VIEW 1: MAIN LANDING PAGE (ECOSYSTEM HERO & MAIN CARDS) */}
      {view === 'home' && (
        <main className="max-w-6xl w-full mx-auto my-auto py-8 space-y-10">
          {/* Hero Banner */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold shadow-sm font-mono">
              <Sparkles className="w-4 h-4 text-indigo-600" /> MediVerse — Multi-Hospital Clinical Governance Platform
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              One Platform. Every Hospital. <span className="bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">MediVerse.</span>
            </h2>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Software Owners approve hospital registrations and issue Super Admin credentials. Super Admins provision Department Leads, and Department Leads provision Doctors & Staff — all in real-time.
            </p>
          </div>

          {/* 4 MAIN ACTION PATHWAYS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* CARD 1: REGISTER HOSPITAL */}
            <div className="bg-white border border-indigo-200 p-6 rounded-3xl shadow-lg hover:border-indigo-500 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="p-3 w-fit rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700">
                  <Building className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Register Hospital / Organization</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For Hospital Directors: Submit registration details for your hospital to join the ecosystem.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setView('register_org')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Register Hospital Now
                </button>
                <button
                  onClick={() => setView('check_status')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 font-mono"
                >
                  <Search className="w-3.5 h-3.5" /> Check Status
                </button>
              </div>
            </div>

            {/* CARD 2: SOFTWARE OWNER PORTAL */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg hover:border-purple-400 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="p-3 w-fit rounded-2xl bg-purple-50 border border-purple-200 text-purple-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Software Owner Portal</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For Ecosystem Owners: Review pending hospital applications, authorize hospitals & issue Super Admin credentials.
                </p>
              </div>

              <button
                onClick={() => {
                  setEmail('owner@hospitalecho.com');
                  setPassword('password123');
                  setView('owner_login');
                }}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Key className="w-4 h-4" /> Owner Sign In
              </button>
            </div>

            {/* CARD 3: HOSPITAL STAFF LOGIN */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg hover:border-sky-400 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="p-3 w-fit rounded-2xl bg-sky-50 border border-sky-200 text-sky-700">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Hospital Staff Login</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For Staff: Log in with credentials issued by Super Admin (for Dept Admins) or Dept Admin (for Doctors/Nurses).
                </p>
              </div>

              <button
                onClick={() => setView('org_login')}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                Access Staff Workstation <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* CARD 4: PATIENT PORTAL */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-lg hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between space-y-4 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="p-3 w-fit rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Patient Portal</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For Patients: Originally generate your own login credentials via self-registration to manage medical records.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setEmail('patient@hospital.com');
                    setPassword('password123');
                    setView('patient_login');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> Patient Login
                </button>
                <button
                  onClick={() => setView('patient_signup')}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Self-Register
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: REGISTER HOSPITAL / ORGANIZATION FORM */}
      {view === 'register_org' && (
        <main className="max-w-3xl w-full mx-auto my-auto py-8">
          <div className="bg-white border border-indigo-200 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold font-mono">
                <Building className="w-3.5 h-3.5" /> Public Hospital Application Form
              </div>
              <h2 className="text-2xl font-black text-slate-900">Register Your Organization / Hospital</h2>
              <p className="text-xs text-slate-500">
                Submit details below. Once approved by the Software Platform Owner, credentials will be issued to your Executive Super Admin.
              </p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            {regSuccessMsg ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 rounded-2xl space-y-4 font-mono text-xs">
                <div className="font-extrabold text-emerald-900 text-base flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" /> Hospital Application Submitted Successfully!
                </div>
                <p>{regSuccessMsg}</p>
                <div className="p-3 bg-white border border-emerald-300 rounded-xl space-y-1">
                  <div><strong>Registered Reg #:</strong> {hospRegNum}</div>
                  <div><strong>Super Admin Email:</strong> {superAdminEmail}</div>
                </div>
                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => {
                      setStatusQuery(hospRegNum);
                      setView('check_status');
                    }}
                    className="px-4 py-2.5 bg-emerald-700 text-white font-bold rounded-xl shadow"
                  >
                    Track Application Status
                  </button>
                  <button
                    onClick={() => setView('home')}
                    className="px-4 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-xl"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterHospital} className="space-y-4 text-xs font-mono">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Hospital / Organization Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. St. Jude Hospital"
                      value={hospName}
                      onChange={(e) => setHospName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Medical Registration Number *</label>
                    <input
                      type="text"
                      placeholder="e.g. REG-STJUDE-2026"
                      value={hospRegNum}
                      onChange={(e) => setHospRegNum(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Hospital Official Email *</label>
                    <input
                      type="email"
                      placeholder="contact@stjude.org"
                      value={hospEmail}
                      onChange={(e) => setHospEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Hospital Phone</label>
                    <input
                      type="text"
                      value={hospPhone}
                      onChange={(e) => setHospPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Facility Type</label>
                    <select
                      value={hospType}
                      onChange={(e) => setHospType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="MULTI_SPECIALTY">Multi-Specialty Hospital</option>
                      <option value="SUPER_SPECIALTY">Super Specialty Clinic</option>
                      <option value="CARDIAC_TRAUMA">Cardiac & Trauma Center</option>
                      <option value="GENERAL_HOSPITAL">General Medical Hospital</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Address Location</label>
                    <input
                      type="text"
                      value={hospAddress}
                      onChange={(e) => setHospAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">City / Region</label>
                    <input
                      type="text"
                      value={hospCity}
                      onChange={(e) => setHospCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                    />
                  </div>
                </div>

                {/* Super Admin Executive Section */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                  <div className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-indigo-600" /> Executive Super Admin Account Target
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Super Admin Full Name *</label>
                      <input
                        type="text"
                        placeholder="Dr. Arthur Pendelton"
                        value={superAdminName}
                        onChange={(e) => setSuperAdminName(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-slate-700 font-bold block mb-1">Super Admin Email (Login ID) *</label>
                      <input
                        type="email"
                        placeholder="superadmin@stjude.org"
                        value={superAdminEmail}
                        onChange={(e) => setSuperAdminEmail(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Required Accreditation Documents Checklist Info */}
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-2.5">
                  <div className="font-extrabold text-purple-900 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-purple-600" /> Mandatory Compliance Documents Checklist (8 Standards)</span>
                    <span className="px-2 py-0.5 bg-purple-200/70 text-purple-900 rounded font-mono font-bold text-[10px]">Ecosystem Standard</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Before platform approval, the Software Owner will verify your hospital's compliance against the following 8 dummy standard documents:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {DUMMY_REQUIRED_HOSPITAL_DOCUMENTS.map((doc) => (
                      <div key={doc.id} className="p-2 bg-white border border-purple-100 rounded-xl text-[10px] flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <div className="truncate">
                          <span className="font-bold text-slate-900">{doc.name}</span>
                          <span className="text-slate-400 block text-[9px] truncate">{doc.issuingAuthority}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold py-3.5 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting Registration...' : 'Submit Hospital Registration Request 🚀'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEligibilityModal(true)}
                    className="px-5 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 font-mono whitespace-nowrap"
                  >
                    <Search className="w-4 h-4 text-slate-950" /> Check Your Eligibility
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ELIGIBILITY & DOCUMENT VERIFICATION CHECKLIST MODAL */}
          {showEligibilityModal && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto font-mono text-xs animate-in fade-in zoom-in duration-150">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-amber-700" /> Platform Verification & Eligibility Checker
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mt-1">
                      Hospital Authorization Eligibility Audit
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify mandatory registration fields & compliance document attachments before sending to Super Admin.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowEligibilityModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 font-bold text-xl"
                  >
                    ×
                  </button>
                </div>

                {/* Important Verification Disclaimer */}
                <div className="p-4 bg-amber-50 border-2 border-amber-400 text-amber-950 rounded-2xl space-y-2">
                  <div className="font-extrabold text-amber-900 text-xs flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700" /> Mandatory Super Admin Verification Notice
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Hospital registrations <strong>CANNOT be directly approved</strong> upon submission. The Platform Owner / Super Admin must mandatorily inspect and verify all 8 submitted accreditation documents before granting platform access and issuing credentials.
                  </p>
                </div>

                {/* Eligibility Scorecard */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="font-extrabold text-slate-900 text-xs flex justify-between items-center">
                    <span>REGISTRATION FIELD ELIGIBILITY CHECKLIST</span>
                    <span className={`px-2.5 py-0.5 rounded font-black text-[10px] ${
                      hospName && hospRegNum && hospEmail && superAdminEmail
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {hospName && hospRegNum && hospEmail && superAdminEmail ? 'FIELD CRITERIA MET ✅' : 'FIELDS INCOMPLETE ⚠️'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      hospName.trim().length >= 3 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <span>1. Hospital Legal Name</span>
                      <span className="font-bold">{hospName.trim().length >= 3 ? 'Valid ✓' : 'Missing ✗'}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      hospRegNum.trim().length >= 4 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <span>2. Medical Registration No</span>
                      <span className="font-bold">{hospRegNum.trim().length >= 4 ? 'Valid Format ✓' : 'Missing ✗'}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      hospEmail.includes('@') ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <span>3. Official Facility Email</span>
                      <span className="font-bold">{hospEmail.includes('@') ? 'Valid Domain ✓' : 'Invalid ✗'}</span>
                    </div>

                    <div className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      superAdminEmail.includes('@') && superAdminName.trim().length >= 3 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      <span>4. Super Admin Executive</span>
                      <span className="font-bold">{superAdminEmail.includes('@') ? 'Assigned ✓' : 'Missing ✗'}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Documents Bundle Tracker */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center font-extrabold text-slate-900 text-xs">
                    <span>MANDATORY VERIFICATION DOCUMENTS SUBMISSION (8/8)</span>
                    <span className="text-purple-700">
                      {Object.values(attachedDocs).filter(Boolean).length} / 8 Ready for Audit
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    {DUMMY_REQUIRED_HOSPITAL_DOCUMENTS.map((doc) => {
                      const isAttached = attachedDocs[doc.id] !== false;
                      return (
                        <div
                          key={doc.id}
                          onClick={() => setAttachedDocs((prev) => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                          className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                            isAttached ? 'bg-purple-50/70 border-purple-300 text-purple-950' : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isAttached}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                          />
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 leading-snug">{doc.name}</div>
                            <div className="text-[10px] text-slate-500">{doc.issuingAuthority} • {doc.documentNumber}</div>
                            <div className={`text-[9px] font-bold ${isAttached ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {isAttached ? '✓ Attached & Ready for Super Admin Review' : '✗ Unattached'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center border-t border-slate-100 pt-4 gap-3">
                  <div className="text-slate-600 text-[11px]">
                    Status: <strong className="text-indigo-700">Ready for Super Admin Verification Audit</strong>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setShowEligibilityModal(false)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl flex-1 sm:flex-initial"
                    >
                      Close Eligibility Checker
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        setShowEligibilityModal(false);
                        handleRegisterHospital(e);
                      }}
                      disabled={loading || !hospName || !hospRegNum || !hospEmail || !superAdminEmail}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-md flex-1 sm:flex-initial text-xs"
                    >
                      {loading ? 'Submitting...' : 'Submit Request for Verification 🚀'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      )}

      {/* VIEW 3: CHECK APPLICATION STATUS */}
      {view === 'check_status' && (
        <main className="max-w-2xl w-full mx-auto my-auto py-8">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold font-mono">
                <Search className="w-3.5 h-3.5" /> Application Tracker
              </div>
              <h2 className="text-2xl font-black text-slate-900">Check Hospital Registration Status</h2>
              <p className="text-xs text-slate-500">Enter your Registration Number, Code, or Email below.</p>
            </div>

            <form onSubmit={handleCheckStatus} className="space-y-4 text-xs font-mono">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Reg No (e.g. REG-APEX-9988) or email..."
                  value={statusQuery}
                  onChange={(e) => setStatusQuery(e.target.value)}
                  className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  required
                />
                <button
                  type="submit"
                  disabled={statusLoading}
                  className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold rounded-xl shadow"
                >
                  {statusLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {statusError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono rounded-xl font-bold">
                ⚠️ {statusError}
              </div>
            )}

            {statusResult && (
              <div className="p-6 bg-slate-50 border border-slate-300 rounded-2xl space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-[10px] text-indigo-600 font-bold uppercase">{statusResult.code}</div>
                    <h3 className="font-extrabold text-slate-900 text-base">{statusResult.name}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    statusResult.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    statusResult.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {statusResult.status}
                  </span>
                </div>

                <div className="space-y-2 text-slate-700">
                  <div><strong>Registration Number:</strong> {statusResult.registrationNumber}</div>
                  <div><strong>Hospital Email:</strong> {statusResult.email}</div>
                  <div><strong>Super Admin Email:</strong> {statusResult.superAdminEmail}</div>
                </div>

                {statusResult.status === 'PENDING' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
                    ⏳ Application is currently under review by the Software Platform Owner. Once approved, credentials will be issued.
                  </div>
                )}

                {statusResult.status === 'APPROVED' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl space-y-2">
                    <div className="font-bold text-emerald-900">✅ Hospital Authorized in Ecosystem!</div>
                    <p className="text-[11px]">The Super Admin account for {statusResult.superAdminEmail} is active. Use the Staff Login portal to access the workstation.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      {/* VIEW 4: SOFTWARE OWNER LOGIN / STAFF LOGIN VIEW */}
      {(view === 'org_login' || view === 'owner_login') && (
        <main className="max-w-5xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Login Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> {view === 'owner_login' ? 'Software Owner Portal' : 'Hospital Staff Portal'}
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {view === 'owner_login' ? 'Platform Owner Login' : 'Sign In to Staff Workstation'}
              </h2>
              <p className="text-xs text-slate-500">Enter your official login credentials below.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
              >
                {loading ? 'Authenticating...' : 'Sign In & Launch Workstation 🚀'}
              </button>
            </form>
          </div>

          {/* Right: Quick Demo Credential Selector */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-6 rounded-3xl shadow-lg space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" /> Demo Ecosystem Credentials
                </h3>
                <p className="text-[11px] text-slate-500">Click any account below to quick-fill login credentials</p>
              </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {['ALL', 'OWNER', 'ADMIN', 'DOCTOR', 'NURSE', 'OTHER'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setOrgCategory(cat as any)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                    orgCategory === cat ? 'bg-indigo-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {demoAccounts
                .filter((acc) => orgCategory === 'ALL' || acc.category === orgCategory)
                .map((acc, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAutoFill(acc.email, acc.pass)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl cursor-pointer transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-900 group-hover:text-indigo-900">{acc.name}</div>
                      <div className="text-[11px] text-slate-500">{acc.email}</div>
                      <div className="text-[10px] text-slate-400 italic mt-0.5">{acc.desc}</div>
                    </div>
                    <span className="px-2 py-1 bg-white border border-slate-200 text-slate-700 text-[10px] font-bold rounded group-hover:bg-indigo-600 group-hover:text-white transition">
                      Fill
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </main>
      )}

      {/* VIEW 5 & 6: PATIENT LOGIN / PATIENT SIGNUP VIEWS */}
      {(view === 'patient_login' || view === 'patient_signup') && (
        <main className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6 font-mono text-xs">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">
                <User className="w-3.5 h-3.5" /> {view === 'patient_signup' ? 'Patient Self-Registration' : 'Patient Portal Login'}
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {view === 'patient_signup' ? 'Create Patient Account' : 'Patient Sign In'}
              </h2>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            {view === 'patient_login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-bold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
                >
                  {loading ? 'Logging in...' : 'Sign In to Patient Portal'}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePatientSelfRegister} className="space-y-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Email</label>
                  <input
                    type="email"
                    value={regPatientEmail}
                    onChange={(e) => setRegPatientEmail(e.target.value)}
                    placeholder="patient@gmail.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Password</label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow"
                >
                  {loading ? 'Creating Account...' : 'Generate Patient Account & Sign In'}
                </button>
              </form>
            )}
          </div>
        </main>
      )}

      {/* Footer Bar */}
      <footer className="max-w-6xl w-full mx-auto border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-xs font-mono gap-2">
        <div>MediVerse Clinical Platform • v2.6 Core Architecture</div>
        <div className="flex gap-4">
          <span className="text-indigo-600 font-bold">PLATFORM OWNER AUTHORIZED</span>
          <span>•</span>
          <span className="text-emerald-600 font-bold">DETERMINISTIC ACID LOCKING</span>
        </div>
      </footer>
    </div>
  );
}
