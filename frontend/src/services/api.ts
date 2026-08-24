function getApiHost(): string {
  if (typeof window !== 'undefined') {
    const customHost = localStorage.getItem('h02_api_url');
    if (customHost) return customHost;
  }

  let envHost = ((import.meta as any).env?.VITE_API_URL || '').trim();
  if (envHost) {
    if (!envHost.startsWith('http://') && !envHost.startsWith('https://')) {
      envHost = `https://${envHost}`;
    }
    return envHost;
  }

  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    const backendHost = window.location.hostname.replace('h02-frontend', 'h02-backend');
    return `https://${backendHost}`;
  }

  return 'http://localhost:5000';
}

export function getActiveApiHost(): string {
  return getApiHost();
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('h02_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint: string, options: RequestInit = {}) {
  const host = getApiHost();
  const baseUrl = `${host.replace(/\/$/, '')}/api`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `HTTP ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth & Access Management
  login: (email: string, password?: string) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  registerPatient: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),
  createStaff: (data: any) => request('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (id: string) => request(`/auth/users/${id}`, { method: 'DELETE' }),

  // Resources & Departments
  getDepartments: () => request('/resources/departments'),
  getBeds: () => request('/resources/beds'),
  createBed: (data: any) => request('/resources/beds', { method: 'POST', body: JSON.stringify(data) }),
  updateBedStatus: (id: string, status: string, currentPatientId?: string) =>
    request(`/resources/beds/${id}`, { method: 'PATCH', body: JSON.stringify({ status, currentPatientId }) }),
  reserveBed: (data: any) => request('/resources/beds/reserve', { method: 'POST', body: JSON.stringify(data) }),

  getDoctors: () => request('/resources/doctors'),
  updateDoctorStatus: (id: string, data: any) => request(`/resources/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getEquipment: () => request('/resources/equipment'),
  createEquipment: (data: any) => request('/resources/equipment', { method: 'POST', body: JSON.stringify(data) }),
  updateEquipmentStatus: (id: string, data: any) => request(`/resources/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  getOTs: () => request('/resources/ots'),
  updateOTStatus: (id: string, data: any) => request(`/resources/ots/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Patients & Admissions
  getPatients: () => request('/patients'),
  createPatient: (data: any) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
  createDepartment: (data: any) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  getPatientProfile: (id: string) => request(`/patients/${id}`),

  admitPatient: (data: any) => request('/admissions/admit', { method: 'POST', body: JSON.stringify(data) }),
  transferPatient: (data: any) => request('/admissions/transfer', { method: 'POST', body: JSON.stringify(data) }),
  dischargePatient: (data: any) => request('/admissions/discharge', { method: 'POST', body: JSON.stringify(data) }),

  // Appointments & Medical
  getAppointments: () => request('/appointments'),
  createAppointment: (data: any) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointmentStatus: (id: string, status: string) => request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  createConsultation: (data: any) => request('/consultations', { method: 'POST', body: JSON.stringify(data) }),
  createPrescription: (data: any) => request('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  createReport: (data: any) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  createVital: (data: any) => request('/vitals', { method: 'POST', body: JSON.stringify(data) }),
  updateCareTask: (id: string, status: string) => request(`/care-tasks/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Transactions & Conflicts & Audit
  getTransactions: () => request('/transactions'),
  getTransactionDetail: (id: string) => request(`/transactions/${id}`),
  executeTransaction: (data: any) => request('/transactions/execute', { method: 'POST', body: JSON.stringify(data) }),

  getConflicts: () => request('/conflicts'),
  overrideConflict: (data: any) => request('/conflicts/override', { method: 'POST', body: JSON.stringify(data) }),

  getAuditLogs: () => request('/audit-logs'),
  getEvents: () => request('/events'),

  // Simulation Lab
  runSimulation: (scenario: string) => request('/simulation/run', { method: 'POST', body: JSON.stringify({ scenario }) }),
};
