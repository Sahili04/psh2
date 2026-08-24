import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ShieldCheck, Building, Stethoscope, HeartPulse,
  User, UserPlus, ArrowRight, Key, Sparkles, LogIn, ChevronRight,
  Shield, CheckCircle2, Zap, Award, Layers
} from 'lucide-react';

export function Login() {
  const { login, registerPatient } = useAuth();
  const navigate = useNavigate();

  // Navigation View State: 'home' | 'patient_login' | 'patient_signup' | 'org_login'
  const [view, setView] = useState<'home' | 'patient_login' | 'patient_signup' | 'org_login'>('home');

  // Org Category Filter: 'ALL' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'OTHER'
  const [orgCategory, setOrgCategory] = useState<'ALL' | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'OTHER'>('ALL');

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Patient Registration State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDob, setRegDob] = useState('1995-04-12');
  const [regGender, setRegGender] = useState('Male');
  const [regPhone, setRegPhone] = useState('+1-555-0188');
  const [regBlood, setRegBlood] = useState('O+');

  const demoAccounts = [
    { category: 'ADMIN', role: 'SUPER_ADMIN', name: 'Super Admin Control', email: 'superadmin@hospital.com', pass: 'password123', desc: 'Controls hierarchy — Assign & Revoke Dept Admins' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'ICU Dept Admin', email: 'deptadmin@hospital.com', pass: 'password123', desc: 'ICU Department Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Emergency Dept Admin', email: 'admin.emergency@hospital.com', pass: 'password123', desc: 'Emergency & Trauma Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Cardiology Dept Admin', email: 'admin.cardiology@hospital.com', pass: 'password123', desc: 'Cardiology Unit Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Neurology Dept Admin', email: 'admin.neurology@hospital.com', pass: 'password123', desc: 'Neurology Department Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Orthopedics Dept Admin', email: 'admin.orthopedics@hospital.com', pass: 'password123', desc: 'Orthopedics Center Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Pediatrics Dept Admin', email: 'admin.pediatrics@hospital.com', pass: 'password123', desc: 'Pediatrics Ward Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Oncology Dept Admin', email: 'admin.oncology@hospital.com', pass: 'password123', desc: 'Oncology Center Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Gen Medicine Admin', email: 'admin.general@hospital.com', pass: 'password123', desc: 'General Medicine Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Surgical Suite Admin', email: 'admin.surgery@hospital.com', pass: 'password123', desc: 'Surgical Suite Lead' },
    { category: 'ADMIN', role: 'DEPARTMENT_ADMIN', name: 'Radiology Dept Admin', email: 'admin.radiology@hospital.com', pass: 'password123', desc: 'Radiology & Imaging Lead' },

    { category: 'DOCTOR', role: 'DOCTOR', name: 'Dr. Sarah Jenkins', email: 'doctor@hospital.com', pass: 'password123', desc: 'ICU Lead — Review & Accept Requests' },
    { category: 'DOCTOR', role: 'DOCTOR', name: 'Dr. Robert Chen', email: 'doctor2@hospital.com', pass: 'password123', desc: 'Emergency Medicine Specialist' },
    { category: 'NURSE', role: 'NURSE', name: 'Nurse Emily Watson', email: 'nurse@hospital.com', pass: 'password123', desc: 'ICU Shift Nurse — Bed Allotments & Vitals' },
    
    { category: 'OTHER', role: 'RECEPTIONIST', name: 'Receptionist Michael', email: 'reception@hospital.com', pass: 'password123', desc: 'Patient Check-In & Appointments Queue' },
    { category: 'OTHER', role: 'RESOURCE_MANAGER', name: 'Resource Mgr David', email: 'resource@hospital.com', pass: 'password123', desc: 'Beds, Equipment & Priority Conflict Center' },
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

  const handlePatientSelfRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const user = await registerPatient({
        name: regName,
        email: regEmail,
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
    if (role === 'SUPER_ADMIN') navigate('/super-admin');
    else if (role === 'ADMIN' || role === 'DEPARTMENT_ADMIN') navigate('/admin');
    else if (role === 'DOCTOR') navigate('/doctor');
    else if (role === 'NURSE') navigate('/nurse');
    else if (role === 'RECEPTIONIST') navigate('/receptionist');
    else if (role === 'RESOURCE_MANAGER') navigate('/resource-manager');
    else navigate('/patient-portal');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-6 md:p-12">
      {/* Header Bar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between">
        <div
          onClick={() => setView('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="p-3 bg-sky-100 border border-sky-200 rounded-2xl text-sky-700 shadow-sm group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              H-02 CLINICAL SYSTEM
            </h1>
            <p className="text-xs text-sky-700 font-mono tracking-wider font-semibold">CONCURRENT TRANSACTION PLATFORM</p>
          </div>
        </div>

        {view !== 'home' && (
          <button
            onClick={() => setView('home')}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            ← Back to Homepage
          </button>
        )}
      </header>

      {/* VIEW 1: HOME INFO & SELECTION LANDING PAGE */}
      {view === 'home' && (
        <main className="max-w-6xl w-full mx-auto my-auto py-8 space-y-12">
          {/* Hero Banner & Platform Info */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-sky-600" /> Multi-Specialty Hospital Management System
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Real-Time Clinical Resource Allocation & Transaction Platform
            </h2>
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              Powered by an event-sourced ACID Transaction Engine with deterministic mutex locking, priority preemption, out-of-order sequence safety, and 1000-request zero double-allocation guarantee.
            </p>
          </div>

          {/* 2 MAIN ACCESS CARDS (Patient vs Organization) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* CARD 1: Patient Login / Sign Up */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg hover:border-emerald-400 transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="p-3.5 w-fit rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                  <User className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">Patient Portal</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For Patients: Self-register your medical account, view active bed allotments, access diagnostic reports, and check prescriptions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    setEmail('patient@hospital.com');
                    setPassword('password123');
                    setView('patient_login');
                  }}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> Patient Sign In
                </button>
                <button
                  onClick={() => setView('patient_signup')}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-300 transition flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Sign Up / Self-Register
                </button>
              </div>
            </div>

            {/* CARD 2: Organization Staff Login */}
            <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg hover:border-sky-400 transition-all duration-300 flex flex-col justify-between space-y-6 hover:-translate-y-1">
              <div className="space-y-3">
                <div className="p-3.5 w-fit rounded-2xl bg-sky-50 border border-sky-200 text-sky-700">
                  <Building className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-extrabold text-slate-900">Organization Staff Login</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  For Hospital Staff: Super Admin & Departmental Admins (22 departments), Doctor Workstations, Nursing Stations & Resource Control.
                </p>
              </div>

              <button
                onClick={() => setView('org_login')}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                Access Staff Portal <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick System Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1 shadow-sm">
              <div className="text-xl font-black text-sky-700">22 Multi-Specialty Depts</div>
              <div className="text-xs text-slate-500 font-mono">Emergency, ICU, Cardiology, Surgery...</div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1 shadow-sm">
              <div className="text-xl font-black text-emerald-600">60 Hospital Beds</div>
              <div className="text-xs text-slate-500 font-mono">ICU, General, Isolation, Emergency</div>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl text-center space-y-1 shadow-sm">
              <div className="text-xl font-black text-amber-600">0 Double Allocations</div>
              <div className="text-xs text-slate-500 font-mono">Verified under 1000 req/s stress workload</div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 2: ORGANIZATION STAFF LOGIN VIEW */}
      {view === 'org_login' && (
        <main className="max-w-5xl w-full mx-auto my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Organization Login Form */}
          <div className="lg:col-span-6 bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" /> Organization Staff Portal
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign In to Staff Workstation</h2>
              <p className="text-xs text-slate-500">Enter your official hospital staff credentials below.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Staff Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@hospital.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-sky-500 focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-sky-500 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In as Staff'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right: Staff Category Filters & Demo Accounts */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-100 border border-slate-200 p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" /> Staff Category Demo Accounts
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white border border-slate-300 rounded text-slate-600">
                  Password: password123
                </span>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setOrgCategory('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${orgCategory === 'ALL' ? 'bg-sky-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  All Staff
                </button>
                <button
                  onClick={() => setOrgCategory('ADMIN')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${orgCategory === 'ADMIN' ? 'bg-purple-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  1. Administration
                </button>
                <button
                  onClick={() => setOrgCategory('DOCTOR')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${orgCategory === 'DOCTOR' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  2. Doctor Workstation
                </button>
                <button
                  onClick={() => setOrgCategory('NURSE')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition ${orgCategory === 'NURSE' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  3. Nurse Station
                </button>
              </div>

              {/* Demo Accounts List */}
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {demoAccounts
                  .filter((acc) => orgCategory === 'ALL' || acc.category === orgCategory)
                  .map((acc) => (
                    <div
                      key={acc.email}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between hover:border-sky-300 transition text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {acc.name}
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                            {acc.role}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{acc.email}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAutoFill(acc.email, acc.pass)}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-bold font-mono transition"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 3: PATIENT LOGIN VIEW */}
      {view === 'patient_login' && (
        <main className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="p-3 w-fit mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Patient Sign In</h2>
              <p className="text-xs text-slate-500">Access your personal health records and appointments.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Patient Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@hospital.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 font-mono text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Sign In as Patient'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-bold text-slate-800">Demo Patient Account</div>
                <div className="text-[11px] font-mono text-slate-500">patient@hospital.com</div>
              </div>
              <button
                type="button"
                onClick={() => handleAutoFill('patient@hospital.com', 'password123')}
                className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded font-mono font-bold text-xs"
              >
                Auto-Fill
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Don't have an account?{' '}
              <button onClick={() => setView('patient_signup')} className="text-emerald-700 font-bold hover:underline">
                Sign Up / Self-Register
              </button>
            </div>
          </div>
        </main>
      )}

      {/* VIEW 4: PATIENT SIGN UP / SELF-REGISTRATION VIEW */}
      {view === 'patient_signup' && (
        <main className="max-w-md w-full mx-auto my-auto py-8">
          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl space-y-6">
            <div className="space-y-2 text-center">
              <div className="p-3 w-fit mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <UserPlus className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Patient Self-Registration</h2>
              <p className="text-xs text-slate-500">Create your personal patient medical account.</p>
            </div>

            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono rounded-xl font-bold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handlePatientSelfRegister} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-mono block mb-1">Full Name</label>
                <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="e.g. Jane Smith" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Email Address</label>
                <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="jane@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div>
                <label className="text-slate-600 font-mono block mb-1">Password</label>
                <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Date of Birth</label>
                  <input type="date" value={regDob} onChange={(e) => setRegDob(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
                </div>
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Gender</label>
                  <select value={regGender} onChange={(e) => setRegGender(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Phone</label>
                  <input type="text" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900" required />
                </div>
                <div>
                  <label className="text-slate-600 font-mono block mb-1">Blood Group</label>
                  <select value={regBlood} onChange={(e) => setRegBlood(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900">
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg shadow-sm">
                  {loading ? 'Creating Account...' : 'Register & Log In Immediately'}
                </button>
              </div>
            </form>

            <div className="pt-2 text-center text-xs text-slate-500">
              Already have an account?{' '}
              <button onClick={() => setView('patient_login')} className="text-emerald-700 font-bold hover:underline">
                Sign In as Patient
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Footer Bar */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-500 font-mono space-y-1">
        <div>H-02 Clinical System • Real-Time Transaction Engine • Password Authentication Active</div>
        <div className="text-[10px] text-sky-600 font-mono font-bold">
          Connected Backend API: {(import.meta as any).env?.VITE_API_URL || 'Auto-Detected (Render / Local)'}
        </div>
      </footer>
    </div>
  );
}
