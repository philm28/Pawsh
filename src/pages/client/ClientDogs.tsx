import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Plus, Dog as DogIcon, Camera, ChevronLeft, Trash2, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNav } from '../../contexts/NavContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { Dog } from '../../lib/types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';

interface DogFormFieldsProps {
  form: Partial<Dog>;
  setForm: Dispatch<SetStateAction<Partial<Dog>>>;
}

function DogFormFields({ form, setForm }: DogFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Dog's Name *</label>
          <input
            required
            value={form.name ?? ''}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            placeholder="Buddy"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Breed</label>
          <input
            value={form.breed ?? ''}
            onChange={e => setForm(p => ({ ...p, breed: e.target.value }))}
            placeholder="Labrador"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Age (years)</label>
          <input
            type="number"
            min={0}
            value={form.age ?? ''}
            onChange={e => setForm(p => ({ ...p, age: e.target.value ? +e.target.value : undefined }))}
            placeholder="3"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (lbs)</label>
          <input
            type="number"
            min={0}
            value={form.weight ?? ''}
            onChange={e => setForm(p => ({ ...p, weight: e.target.value ? +e.target.value : undefined }))}
            placeholder="60"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Feeding Notes</label>
        <textarea
          value={form.feeding_notes ?? ''}
          onChange={e => setForm(p => ({ ...p, feeding_notes: e.target.value }))}
          placeholder="Feed twice a day..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 resize-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Behavioral Notes</label>
        <textarea
          value={form.behavioral_notes ?? ''}
          onChange={e => setForm(p => ({ ...p, behavioral_notes: e.target.value }))}
          placeholder="Friendly, but barks at strangers..."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500 resize-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vet Name</label>
          <input
            value={form.vet_name ?? ''}
            onChange={e => setForm(p => ({ ...p, vet_name: e.target.value }))}
            placeholder="Dr. Smith"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vet Phone</label>
          <input
            type="tel"
            value={form.vet_phone ?? ''}
            onChange={e => setForm(p => ({ ...p, vet_phone: e.target.value }))}
            placeholder="(555) 000-0000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Contact</label>
          <input
            value={form.emergency_contact_name ?? ''}
            onChange={e => setForm(p => ({ ...p, emergency_contact_name: e.target.value }))}
            placeholder="John Smith"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Phone</label>
          <input
            type="tel"
            value={form.emergency_contact_phone ?? ''}
            onChange={e => setForm(p => ({ ...p, emergency_contact_phone: e.target.value }))}
            placeholder="(555) 000-0000"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
          />
        </div>
      </div>
    </div>
  );
}

export default function ClientDogs() {
  const { profile } = useAuth();
  const { selectedDogId, setSelectedDogId } = useNav();
  const { toast } = useToast();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Dog | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<Partial<Dog>>({});

  async function loadDogs() {
    const { data } = await supabase.from('dogs').select('*').eq('owner_id', profile!.id).order('name');
    if (data) {
      setDogs(data as Dog[]);
      if (selectedDogId) {
        const dog = data.find(d => d.id === selectedDogId);
        if (dog) { setEditing(dog as Dog); setForm(dog as Dog); }
      }
    }
    setLoading(false);
  }

  useEffect(() => { loadDogs(); }, [profile]);

  function openEdit(dog: Dog) {
    setEditing(dog);
    setForm(dog);
    setSelectedDogId(dog.id);
  }

  function openAdd() {
    setEditing(null);
    setForm({});
    setShowAddModal(true);
  }

  async function saveDog(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name?.trim()) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('dogs').update({ ...form }).eq('id', editing.id);
      if (error) toast('Failed to save changes.', 'error');
      else toast('Dog profile updated!', 'success');
    } else {
      const { error } = await supabase.from('dogs').insert({ ...form, owner_id: profile!.id });
      if (error) toast('Failed to add dog.', 'error');
      else { toast('Dog added!', 'success'); setShowAddModal(false); }
    }
    setSaving(false);
    await loadDogs();
  }

  async function deleteDog() {
    if (!editing) return;
    setDeleting(true);
    const { error } = await supabase.from('dogs').delete().eq('id', editing.id);
    setDeleting(false);
    if (error) toast('Failed to delete dog.', 'error');
    else {
      toast(`${editing.name} removed.`, 'success');
      setShowDeleteConfirm(false);
      setEditing(null);
      setSelectedDogId(null);
      await loadDogs();
    }
  }

  async function uploadPhoto(file: File, dogId: string) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile!.id}/${dogId}.${ext}`;
    const { error: upErr } = await supabase.storage.from('dog-photos').upload(path, file, { upsert: true });
    if (upErr) { toast('Upload failed.', 'error'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('dog-photos').getPublicUrl(path);
    const photo_url = urlData.publicUrl;
    await supabase.from('dogs').update({ photo_url }).eq('id', dogId);
    setUploading(false);
    toast('Photo updated!', 'success');
    await loadDogs();
    setForm(prev => ({ ...prev, photo_url }));
  }

  if (loading) return <LoadingSpinner className="min-h-screen" />;

  // Detail/Edit view
  if (editing) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-8">
        <button
          onClick={() => { setEditing(null); setSelectedDogId(null); }}
          className="flex items-center gap-2 text-gray-600 mb-5 text-sm font-medium hover:text-gray-900"
        >
          <ChevronLeft size={18} />
          All Dogs
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {form.photo_url ? (
              <img src={form.photo_url} alt={form.name} className="w-20 h-20 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#FFF5B8' }}>
                <DogIcon size={32} style={{ color: '#B8860B' }} />
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-full border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f && editing) uploadPhoto(f, editing.id);
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">{editing.name}</h1>
            <p className="text-gray-500 text-sm">{editing.breed ?? 'Unknown breed'}</p>
          </div>
        </div>

        <form onSubmit={saveDog} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <DogFormFields form={form} setForm={setForm} />
          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
        >
          <Trash2 size={15} />
          Remove {editing.name}
        </button>

        <Modal
          open={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title={`Remove ${editing?.name}?`}
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={deleteDog}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-60 hover:bg-red-600 transition-colors"
              >
                {deleting ? 'Removing…' : 'Yes, Remove'}
              </button>
            </div>
          }
        >
          <p className="text-gray-600 text-sm py-2">
            This will permanently delete <strong className="text-gray-900">{editing?.name}</strong>'s profile. Any scheduled walks will not be affected.
          </p>
        </Modal>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">My Dogs</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[#1A1A1A] text-sm font-semibold"
          style={{ backgroundColor: '#F2C94C' }}
        >
          <Plus size={16} />
          Add Dog
        </button>
      </div>

      {dogs.length === 0 ? (
        <div className="text-center py-16">
          <DogIcon size={48} className="mx-auto mb-3 text-gray-200" />
          <p className="text-gray-500 font-medium">No dogs added yet.</p>
          <p className="text-gray-400 text-sm mt-1">Add your first dog to get started.</p>
          <button
            onClick={openAdd}
            className="mt-4 px-5 py-2.5 rounded-xl text-[#1A1A1A] text-sm font-semibold"
            style={{ backgroundColor: '#F2C94C' }}
          >
            Add a Dog
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dogs.map(dog => (
            <button
              key={dog.id}
              onClick={() => openEdit(dog)}
              className="w-full bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:border-forest-200 transition-colors text-left"
            >
              {dog.photo_url ? (
                <img src={dog.photo_url} alt={dog.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#FFF5B8' }}>
                  <DogIcon size={24} style={{ color: '#B8860B' }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#1A1A1A]">{dog.name}</div>
                <div className="text-sm text-gray-500">{dog.breed ?? 'Unknown breed'}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {[dog.age ? `${dog.age}y` : null, dog.weight ? `${dog.weight} lbs` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
              <ChevronLeft className="rotate-180 text-gray-300" size={18} />
            </button>
          ))}
        </div>
      )}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add a Dog"
        footer={
          <button
            form="add-dog-form"
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl text-[#1A1A1A] font-semibold disabled:opacity-60"
            style={{ backgroundColor: '#F2C94C' }}
          >
            {saving ? 'Adding…' : 'Add Dog'}
          </button>
        }
      >
        <form id="add-dog-form" onSubmit={saveDog}>
          <DogFormFields form={form} setForm={setForm} />
        </form>
      </Modal>
    </div>
  );
}
