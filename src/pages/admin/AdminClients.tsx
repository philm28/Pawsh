import { useEffect, useState } from 'react';
import { Users, Dog, Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../lib/types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface ClientWithDogs extends Profile {
  dog_count: number;
}

export default function AdminClients() {
  const [clients, setClients] = useState<ClientWithDogs[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      const { data: clientsData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('full_name');

      if (!clientsData) { setLoading(false); return; }

      const { data: dogsData } = await supabase
        .from('dogs')
        .select('owner_id');

      const dogCounts = new Map<string, number>();
      for (const d of (dogsData ?? [])) {
        dogCounts.set(d.owner_id, (dogCounts.get(d.owner_id) ?? 0) + 1);
      }

      setClients(clientsData.map(c => ({
        ...c,
        dog_count: dogCounts.get(c.id) ?? 0,
      } as ClientWithDogs)));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = search.trim()
    ? clients.filter(c => {
        const q = search.toLowerCase();
        return (
          (c.full_name ?? '').toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.phone ?? '').includes(q)
        );
      })
    : clients;

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-serif text-2xl font-bold text-[#2B2620]">Clients</h1>
        <div className="text-sm text-gray-500">{clients.length} total</div>
      </div>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by name, email, or phone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:border-forest-500 shadow-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">{search ? 'No clients match your search.' : 'No clients yet.'}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.map((client, i) => (
            <div
              key={client.id}
              className={`flex items-center gap-4 px-4 py-3.5 ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-semibold text-sm" style={{ backgroundColor: '#FBF1D9', color: '#9C7A3C' }}>
                {(client.full_name ?? client.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-[#2B2620] truncate">{client.full_name ?? '—'}</div>
                <div className="text-xs text-gray-500 truncate">{client.email}</div>
                {client.phone && <div className="text-xs text-gray-400">{client.phone}</div>}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0">
                <Dog size={13} />
                {client.dog_count} {client.dog_count === 1 ? 'dog' : 'dogs'}
              </div>
            </div>
          ))}
        </div>
      )}
      {search && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">{filtered.length} of {clients.length} clients</p>
      )}
    </div>
  );
}
