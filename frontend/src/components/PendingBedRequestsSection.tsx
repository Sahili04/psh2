import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Bed, Clock, AlertTriangle, CheckCircle2, XCircle, RefreshCw, User, Shield, ArrowRightLeft } from 'lucide-react';

export function PendingBedRequestsSection() {
  const { socket, addToast } = useSocket();
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Offer Alternative Bed Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedTxForOffer, setSelectedTxForOffer] = useState<any>(null);
  const [alternativeBedId, setAlternativeBedId] = useState('');
  const [offerReason, setOfferReason] = useState('Offered alternative bed at another department.');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = () => {
      loadData();
    };

    socket.on('transaction:created', handleUpdate);
    socket.on('transaction:updated', handleUpdate);

    return () => {
      socket.off('transaction:created', handleUpdate);
      socket.off('transaction:updated', handleUpdate);
    };
  }, [socket]);

  const loadData = async () => {
    try {
      const [txList, bedList, deptList] = await Promise.all([
        api.getTransactions().catch(() => []),
        api.getBeds().catch(() => []),
        api.getDepartments().catch(() => []),
      ]);

      const txArr = Array.isArray(txList) ? txList : [];
      const bedArr = Array.isArray(bedList) ? bedList : [];
      const deptArr = Array.isArray(deptList) ? deptList : [];

      setBeds(bedArr);
      setDepts(deptArr);

      // Filter only PENDING bed requests (status === 'REQUESTED' or 'VALIDATING')
      const pending = txArr.filter(
        (t: any) =>
          t.resourceType === 'BED' &&
          (t.status === 'REQUESTED' || t.status === 'VALIDATING')
      );

      setPendingRequests(pending);
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (txId: string) => {
    setActionLoadingId(txId);
    try {
      const res = await api.acceptBedRequest(txId, { acceptedBy: 'RESOURCE_MANAGER' });
      addToast('success', 'Request Approved', res.message || 'Bed request approved.');
      loadData();
    } catch (err: any) {
      addToast('error', 'Allocation Failed', err.message || 'Failed to accept request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (txId: string) => {
    setActionLoadingId(txId);
    try {
      const res = await api.rejectBedRequest(txId, { rejectedBy: 'RESOURCE_MANAGER' });
      addToast('warning', 'Request Rejected', res.message || 'Bed request rejected.');
      loadData();
    } catch (err: any) {
      addToast('error', 'Action Failed', err.message || 'Failed to reject request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOfferAlternative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForOffer || !alternativeBedId) return;

    setActionLoadingId(selectedTxForOffer.id);
    try {
      const res = await api.offerAlternativeBed(selectedTxForOffer.id, {
        newBedId: alternativeBedId,
        offeredBy: 'DEPARTMENT_ADMIN',
        reason: offerReason,
      });
      addToast('success', 'Alternative Bed Offered & Allocated', res.message || 'Alternative bed assigned.');
      setShowOfferModal(false);
      setSelectedTxForOffer(null);
      loadData();
    } catch (err: any) {
      addToast('error', 'Offer Failed', err.message || 'Failed to offer alternative bed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getBedInfo = (bedId: string) => {
    const found = beds.find((b) => b.id === bedId);
    if (!found) return { number: bedId, deptName: 'Hospital Ward' };
    const d = depts.find((dept) => dept.id === found.departmentId);
    return {
      number: found.bedNumber,
      deptName: d?.name || 'Department Ward',
      type: found.type,
      floor: found.floor,
    };
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse';
      case 'CRITICAL':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold';
      case 'URGENT':
        return 'bg-purple-100 text-purple-800 border-purple-300 font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  };

  const availableBedsList = beds.filter((b) => b.status === 'AVAILABLE');

  return (
    <div className="bg-white border-2 border-sky-200 rounded-2xl p-6 shadow-md space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Bed className="w-5 h-5 text-sky-600 animate-pulse" /> Pending Bed & Transfer Requests ({pendingRequests.length})
          </h2>
          <p className="text-xs text-slate-500">
            Resource Allocation Queue — Authorized Department Admins can Accept, Reject, or Offer Bed at another Department.
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </button>
      </div>

      {/* List / Table */}
      {loading ? (
        <div className="py-8 text-center text-slate-500 text-xs font-mono">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-sky-600 mb-2" /> Loading pending requests...
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs font-mono">
          ✅ No Pending Bed Requests at this time. All requests processed.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRequests.map((req) => {
            const bedInfo = getBedInfo(req.resourceId);
            const patientName = req.patient?.name || 'John Doe';
            const reqTime = new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div
                key={req.id}
                className="bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-sky-300 rounded-xl p-4 transition shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Details */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{patientName}</span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${
                      req.type === 'PATIENT_TRANSFER' ? 'bg-purple-100 text-purple-800 border-purple-300 font-bold' : 'bg-sky-100 text-sky-800 border-sky-300 font-bold'
                    }`}>
                      {req.type === 'PATIENT_TRANSFER' ? 'PATIENT TRANSFER' : 'BED ADMISSION'}
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] ${getPriorityBadgeClass(req.priority)}`}>
                      {req.priority}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded font-bold text-[10px]">
                      Pending
                    </span>
                  </div>

                  <div className="text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
                    <span>Department: <strong className="text-slate-900">{bedInfo.deptName}</strong></span>
                    <span>•</span>
                    <span>Requested Bed: <strong className="text-sky-700">{bedInfo.number}</strong></span>
                    <span>•</span>
                    <span>Request Time: <strong className="text-slate-700">{reqTime}</strong></span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Accept
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTxForOffer(req);
                      if (availableBedsList.length > 0) setAlternativeBedId(availableBedsList[0].id);
                      setShowOfferModal(true);
                    }}
                    disabled={actionLoadingId === req.id}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <ArrowRightLeft className="w-4 h-4" /> Offer Bed at Another Dept
                  </button>

                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={actionLoadingId === req.id}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OFFER ALTERNATIVE BED MODAL */}
      {showOfferModal && selectedTxForOffer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-indigo-600" /> Offer Bed at Another Department
              </h3>
              <button onClick={() => setShowOfferModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleOfferAlternative} className="space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1 text-indigo-950">
                <div>Patient: <strong>{selectedTxForOffer.patient?.name || 'John Doe'}</strong></div>
                <div>Request Priority: <strong>{selectedTxForOffer.priority}</strong></div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Available Bed in Alternative Department</label>
                <select
                  value={alternativeBedId}
                  onChange={(e) => setAlternativeBedId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  required
                >
                  {availableBedsList.map((b) => {
                    const d = depts.find((dept) => dept.id === b.departmentId);
                    return (
                      <option key={b.id} value={b.id}>
                        {b.bedNumber} ({b.type} • {d?.name || 'Dept'} • Floor {b.floor})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Offer Explanation</label>
                <textarea
                  rows={2}
                  value={offerReason}
                  onChange={(e) => setOfferReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={actionLoadingId === selectedTxForOffer.id}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-sm transition"
                >
                  {actionLoadingId === selectedTxForOffer.id ? 'Offering...' : 'Confirm & Offer Alternative Bed 🔀'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
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
