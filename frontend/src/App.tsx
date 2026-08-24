import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffManagementPage } from './pages/StaffManagementPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { NurseDashboard } from './pages/NurseDashboard';
import { ReceptionistDashboard } from './pages/ReceptionistDashboard';
import { ResourceManagerDashboard } from './pages/ResourceManagerDashboard';
import { PatientDashboard } from './pages/PatientDashboard';
import { TransactionCenter } from './pages/TransactionCenter';
import { ConflictCenter } from './pages/ConflictCenter';
import { SimulationLab } from './pages/SimulationLab';
import { PatientsPage } from './pages/PatientsPage';
import { BedsPage } from './pages/BedsPage';
import { AuditPage } from './pages/AuditPage';
import { Role } from './types';

function RoleGuard({ allowedRoles, children }: { allowedRoles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    const fallbackPath =
      user.role === 'SUPER_ADMIN' ? '/super-admin' :
      user.role === 'ADMIN' || user.role === 'DEPARTMENT_ADMIN' ? '/admin' :
      user.role === 'DOCTOR' ? '/doctor' :
      user.role === 'NURSE' ? '/nurse' :
      user.role === 'RECEPTIONIST' ? '/receptionist' :
      user.role === 'RESOURCE_MANAGER' ? '/resource-manager' :
      '/patient-portal';

    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
}

function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 text-slate-600 p-8 font-mono">Authenticating User Credentials...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 bg-slate-50 overflow-y-auto">
          <Routes>
            <Route path="/super-admin" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN']}>
                <SuperAdminDashboard />
              </RoleGuard>
            } />

            <Route path="/admin" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_ADMIN']}>
                <AdminDashboard />
              </RoleGuard>
            } />

            <Route path="/staff-management" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <StaffManagementPage />
              </RoleGuard>
            } />

            <Route path="/departments" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DEPARTMENT_ADMIN']}>
                <DepartmentsPage />
              </RoleGuard>
            } />

            <Route path="/doctor" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR']}>
                <DoctorDashboard />
              </RoleGuard>
            } />

            <Route path="/nurse" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'NURSE']}>
                <NurseDashboard />
              </RoleGuard>
            } />

            <Route path="/receptionist" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']}>
                <ReceptionistDashboard />
              </RoleGuard>
            } />

            <Route path="/resource-manager" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RESOURCE_MANAGER']}>
                <ResourceManagerDashboard />
              </RoleGuard>
            } />

            <Route path="/patient-portal" element={
              <RoleGuard allowedRoles={['PATIENT', 'SUPER_ADMIN', 'ADMIN']}>
                <PatientDashboard />
              </RoleGuard>
            } />

            <Route path="/transactions" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RESOURCE_MANAGER']}>
                <TransactionCenter />
              </RoleGuard>
            } />

            <Route path="/conflicts" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RESOURCE_MANAGER']}>
                <ConflictCenter />
              </RoleGuard>
            } />

            <Route path="/simulation" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'RESOURCE_MANAGER']}>
                <SimulationLab />
              </RoleGuard>
            } />

            <Route path="/patients" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
                <PatientsPage />
              </RoleGuard>
            } />

            <Route path="/beds" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN', 'NURSE', 'RESOURCE_MANAGER']}>
                <BedsPage />
              </RoleGuard>
            } />

            <Route path="/audit-logs" element={
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'ADMIN']}>
                <AuditPage />
              </RoleGuard>
            } />

            <Route path="*" element={
              <Navigate to={
                user.role === 'SUPER_ADMIN' ? '/super-admin' :
                user.role === 'ADMIN' || user.role === 'DEPARTMENT_ADMIN' ? '/admin' :
                user.role === 'DOCTOR' ? '/doctor' :
                user.role === 'NURSE' ? '/nurse' :
                user.role === 'RECEPTIONIST' ? '/receptionist' :
                user.role === 'RESOURCE_MANAGER' ? '/resource-manager' :
                '/patient-portal'
              } replace />
            } />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
