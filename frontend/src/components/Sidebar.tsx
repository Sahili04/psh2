import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, Stethoscope, Bed, Cpu, Volume2, Clock, FileText,
  Calendar, UserPlus, GitCommit, AlertTriangle, Activity, ShieldCheck,
  Zap, HeartPulse, CheckSquare, Building, UserCheck, Pill, TestTube, ArrowRightLeft, LogOut, Wrench
} from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || 'ADMIN';

  const getNavSections = () => {
    switch (role) {
      case 'PLATFORM_OWNER':
        return [
          {
            title: '👑 SOFTWARE OWNER GOVERNANCE',
            items: [
              { label: '1. Executive Ecosystem', path: '/platform-owner?tab=overview', icon: ShieldCheck, badge: 'ECOSYSTEM' },
              { label: '2. Hospital Registration Requests', path: '/platform-owner?tab=pending', icon: Building, badge: 'APPROVALS' },
              { label: '3. Authorized Hospitals', path: '/platform-owner?tab=approved', icon: Users },
            ],
          },
        ];

      case 'SUPER_ADMIN':
        return [
          {
            title: '👑 SUPER ADMIN CONTROL',
            items: [
              { label: '1. Executive Overview', path: '/super-admin?tab=overview', icon: ShieldCheck, badge: 'TOP LEVEL' },
              { label: '2. Department Governance', path: '/super-admin?tab=departments', icon: Building },
              { label: '3. Staff & Access Control', path: '/super-admin?tab=staff', icon: Users },
              { label: '4. Hospital Resources', path: '/super-admin?tab=resources', icon: Bed },
              { label: '5. H-02 Engine Control', path: '/super-admin?tab=h02_control', icon: Zap },
            ],
          },
          {
            title: 'TRANSACTIONS & AUDIT',
            items: [
              { label: 'Transaction Engine', path: '/transactions', icon: GitCommit },
              { label: 'Conflict Center', path: '/conflicts', icon: AlertTriangle },
              { label: 'Audit Logs', path: '/audit-logs', icon: Activity },
              { label: 'H-02 Simulation Lab', path: '/simulation', icon: Zap, badge: 'TEST SUITE' },
            ],
          },
        ];

      case 'ADMIN':
      case 'DEPARTMENT_ADMIN':
        return [
          {
            title: '🏢 DEPARTMENT WORKSTATION',
            items: [
              { label: '1. Dept Overview', path: '/admin?tab=overview', icon: Building },
              { label: '2. Unit Staff Roster', path: '/admin?tab=staff', icon: Stethoscope },
              { label: '3. Unit Patients', path: '/admin?tab=patients', icon: Users },
              { label: '4. Beds & Inventory', path: '/admin?tab=resources', icon: Bed },
              { label: '5. Instrument & Machine Health', path: '/admin?tab=equipment_health', icon: Wrench, badge: 'SURVEY' },
              { label: '6. Unit Appointments', path: '/admin?tab=scheduling', icon: Calendar },
              { label: '7. H-02 Requests', path: '/admin?tab=h02_requests', icon: Zap },
            ],
          },
          {
            title: 'TRANSACTIONS & AUDIT',
            items: [
              { label: 'Transaction Engine', path: '/transactions', icon: GitCommit },
              { label: 'Conflict Center', path: '/conflicts', icon: AlertTriangle },
              { label: 'Audit Logs', path: '/audit-logs', icon: Activity },
            ],
          },
        ];

      case 'DOCTOR':
        return [
          {
            title: '👨‍⚕️ DOCTOR CLINICAL WORKSTATION',
            items: [
              { label: "1. Today's Work", path: '/doctor?tab=todays_work', icon: LayoutDashboard },
              { label: '2. My Patients', path: '/doctor?tab=patients', icon: Users },
              { label: '3. Consultations & Diagnosis', path: '/doctor?tab=consultations', icon: Stethoscope },
              { label: '4. Write Prescriptions', path: '/doctor?tab=prescriptions', icon: Pill },
              { label: '5. Diagnostic Tests', path: '/doctor?tab=tests', icon: TestTube },
              { label: '6. Admissions & Beds', path: '/doctor?tab=admissions', icon: Bed },
              { label: '7. ICU Transfers', path: '/doctor?tab=transfers', icon: ArrowRightLeft },
              { label: '8. Patient Discharges', path: '/doctor?tab=discharges', icon: LogOut },
              { label: '9. H-02 Resource Locks', path: '/doctor?tab=h02_requests', icon: Zap },
            ],
          },
        ];

      case 'NURSE':
        return [
          {
            title: '👩‍⚕️ NURSING WORKSTATION',
            items: [
              { label: '1. Assigned Patients & Beds', path: '/nurse?tab=assigned_patients', icon: Users },
              { label: '2. Record Patient Vitals', path: '/nurse?tab=vitals', icon: HeartPulse },
              { label: '3. Care Tasks Checklist', path: '/nurse?tab=care_tasks', icon: CheckSquare },
              { label: '4. Doctor Orders', path: '/nurse?tab=doctor_orders', icon: Stethoscope },
              { label: '5. Equipment Requests', path: '/nurse?tab=resource_requests', icon: Zap },
              { label: '6. Handle Transfers', path: '/nurse?tab=transfers', icon: ArrowRightLeft },
            ],
          },
        ];

      case 'RECEPTIONIST':
        return [
          {
            title: '🧑‍💼 RECEPTION WORKSTATION',
            items: [
              { label: '1. Check-In & Call Queue', path: '/receptionist?tab=check_in_queue', icon: Volume2 },
              { label: '2. Search & Register Patient', path: '/receptionist?tab=search_register', icon: UserPlus },
              { label: '3. Book Appointment', path: '/receptionist?tab=book_appointment', icon: Calendar },
              { label: '4. Initiate Admission Request', path: '/receptionist?tab=admission_request', icon: Bed },
              { label: '5. Track Patient Status', path: '/receptionist?tab=track_status', icon: Activity },
            ],
          },
        ];

      case 'RESOURCE_MANAGER':
        return [
          {
            title: '🏥 RESOURCE WORKSTATION',
            items: [
              { label: 'Resource Dashboard', path: '/resource-manager', icon: LayoutDashboard },
              { label: 'Conflict Center', path: '/conflicts', icon: AlertTriangle },
              { label: 'Beds Inventory', path: '/beds', icon: Bed },
              { label: 'Equipment List', path: '/equipment', icon: Cpu },
            ],
          },
        ];

      case 'PATIENT':
        return [
          {
            title: '🧑 PATIENT HEALTH PORTAL',
            items: [
              { label: '1. Overview & Admission', path: '/patient-portal?tab=overview', icon: Bed },
              { label: '2. Book Appointment Slot', path: '/patient-portal?tab=book_appointment', icon: Calendar },
              { label: '3. My Appointments', path: '/patient-portal?tab=my_appointments', icon: Clock },
              { label: '4. Read-Only EHR Records', path: '/patient-portal?tab=medical_records', icon: FileText },
              { label: '5. Real-Time Notifications', path: '/patient-portal?tab=notifications', icon: Activity },
            ],
          },
        ];

      default:
        return [];
    }
  };

  const navSections = getNavSections();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between h-[calc(100vh-4rem)] sticky top-16 shadow-sm">
      <div className="p-4 space-y-6 overflow-y-auto">
        {navSections.map((sec, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest px-3">
              {sec.title}
            </div>

            <div className="space-y-1">
              {sec.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium font-mono transition ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {(item as any).badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                      {(item as any).badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
