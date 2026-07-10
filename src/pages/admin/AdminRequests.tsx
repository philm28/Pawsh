import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, UserPlus, Mail, Phone } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { supabase, callEdgeFunction } from '../../lib/supabase';
import { AccessRequest } from '../../lib/types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type Filter = 'pending' | 'all';

export default function AdminRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [processing, setProcessing] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase
      .from('access_requests')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setRequests(data as AccessRequest[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(req: AccessRequest) {
    setProcessing(req.id);
    const res = await callEdgeFunction('approve-access-request', {
      action: 'approve',
      request_id: req.id,
      email: req.email,
      full_name: req.full_name,
      requested_role: req.requested_role,
    });
    const json = await res.json();
    setProcessing(null);
    if (!res.ok || json.error) {
      toast(json.error ?? 'Failed to approve request.', 'error');
    } else {
      toast(`${req.full_name} approved and emailed!`, 'success');
      await load();
    }
  }

  async function handleReject(req: AccessRequest) {
    setProcessing(req.id);
    const res = await callEdgeFunction('approve-access-request', {
      action: 'reject',
      request_id: req.id,
      email: req.email,
      full_name: req.full_name,
      requested_role: req.requested_role,
    });
    const json = await res.json();
    setProcessing(null);
    if (!res.ok || json.error) {
      toast(json.error ?? 'Failed to reject request.', 'error');
    } else {
      toast('Request rejected.', 'success');
      await load();
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const displayed = filter === 'pending' ? requests.filter(r => r.status === 'pending') : requests;

  function statusBadge(status: AccessRequest['status']) {
    if (status === 'pending') return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
        <Clock size={10} /> Pending
      </span>
    );
    if (status === 'approved') return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">
        <CheckCircle size={10} /> Approved
      </span>
    );
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-600">
        <XCircle size={10} /> Rejected
      </span>
    );
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Access Requests</h1>
        {pendingCount > 0 && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: '#C9A84C' }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
        {(['pending', 'all'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-gray-500'
            }`}
          >
            {f === 'pending' ? `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` : 'All'}
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-16">
          <UserPlus size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">
            {filter === 'pending' ? 'No pending requests.' : 'No requests yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(req => (
            <div key={req.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm" style={{ backgroundColor: '#f0f4e8', color: '#2D5016' }}>
                    {req.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-[#1A1A1A]">{req.full_name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {req.requested_role === 'walker' ? 'Dog Walker' : 'Dog Owner'}
                    </div>
                  </div>
                </div>
                {statusBadge(req.status)}
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Mail size={12} />
                  {req.email}
                </div>
                {req.phone && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Phone size={12} />
                    {req.phone}
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  Submitted {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>

              {req.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(req)}
                    disabled={processing === req.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(req)}
                    disabled={processing === req.id}
                    className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors disabled:opacity-50"
                    style={{ backgroundColor: '#2D5016' }}
                  >
                    <CheckCircle size={14} />
                    {processing === req.id ? 'Processing…' : 'Approve & Send Login'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
