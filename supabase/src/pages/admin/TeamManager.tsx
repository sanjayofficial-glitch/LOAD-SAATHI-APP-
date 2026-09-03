import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';
import { createClerkSupabaseClient } from '@/utils/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Upload, Trash2, Plus } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  photo_url: string | null;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
  quote: string | null;
  sort_order: number;
  created_at: string;
}

const EMPTY_MEMBER: Partial<TeamMember> = {
  name: '',
  role: '',
  phone: '',
  photo_url: '',
  linkedin: '',
  twitter: '',
  instagram: '',
  quote: '',
  sort_order: 0,
};

export default function TeamManager() {
  const { getToken } = useClerkAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<Partial<TeamMember> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getClient = useCallback(async () => {
    const token = await getToken();
    if (!token) throw new Error('Not authenticated');
    return createClerkSupabaseClient(token);
  }, [getToken]);

  const fetchMembers = useCallback(async () => {
    try {
      const client = await getClient();
      const { data, error } = await client
        .from('team_members')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  }, [getClient]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const getPublicUrl = (storagePath: string) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    return `${supabaseUrl}/storage/v1/object/public/gallery/${storagePath}`;
  };

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const client = await getClient();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `team/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await client.storage
        .from('gallery')
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;

      const publicUrl = getPublicUrl(path);
      setEditing(prev => prev ? { ...prev, photo_url: publicUrl } : null);
    } catch (err) {
      console.error('Photo upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing || !editing.name || !editing.role) return;
    try {
      const client = await getClient();
      const maxOrder = Math.max(0, ...members.map(m => m.sort_order));

      if (isNew) {
        const { data, error } = await client.rpc('upsert_team_member', {
          p_name: editing.name,
          p_role: editing.role,
          p_phone: editing.phone || null,
          p_photo_url: editing.photo_url || null,
          p_linkedin: editing.linkedin || null,
          p_twitter: editing.twitter || null,
          p_instagram: editing.instagram || null,
          p_quote: editing.quote || null,
          p_sort_order: maxOrder + 1,
        });
        if (error) throw error;
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        setMembers(prev => [...prev, result]);
      } else {
        const { error } = await client.rpc('upsert_team_member', {
          p_id: editing.id,
          p_name: editing.name,
          p_role: editing.role,
          p_phone: editing.phone || null,
          p_photo_url: editing.photo_url || null,
          p_linkedin: editing.linkedin || null,
          p_twitter: editing.twitter || null,
          p_instagram: editing.instagram || null,
          p_quote: editing.quote || null,
        });
        if (error) throw error;
        setMembers(prev => prev.map(m => m.id === editing.id ? { ...m, ...editing } as TeamMember : m));
      }
      setEditing(null);
      setIsNew(false);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleDelete = async (member: TeamMember) => {
    if (!confirm(`Remove "${member.name}" from the team?`)) return;
    try {
      const client = await getClient();
      await client.rpc('delete_team_member', { p_member_id: member.id });
      setMembers(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleMove = async (member: TeamMember, direction: 'up' | 'down') => {
    const sorted = [...members].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(m => m.id === member.id);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const a = sorted[idx];
    const b = sorted[swapIdx];
    if (!a || !b) return;
    const client = await getClient();
    await client.rpc('reorder_team_members', {
      p_ids: [a.id, b.id],
      p_sort_orders: [b.sort_order, a.sort_order],
    });
    await fetchMembers();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Manager</h1>
          <p className="text-muted-foreground mt-1">Edit team member profiles and photos.</p>
        </div>
        <Button
          onClick={() => { setEditing({ ...EMPTY_MEMBER }); setIsNew(true); }}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="border rounded-xl p-6 space-y-4 bg-card">
          <div className="flex items-center gap-6">
            {/* Photo preview */}
            <div className="relative">
              {editing.photo_url ? (
                <img
                  src={editing.photo_url}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-orange-600 text-white rounded-full p-1.5 hover:bg-orange-700 transition-colors"
              >
                <Upload className="h-3 w-3" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePhotoUpload(file);
                }}
              />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{uploading ? 'Uploading photo...' : 'Click camera icon to upload photo'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input value={editing.name || ''} onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Role *</label>
              <Input value={editing.role || ''} onChange={e => setEditing(prev => prev ? { ...prev, role: e.target.value } : null)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Phone</label>
              <Input value={editing.phone || ''} onChange={e => setEditing(prev => prev ? { ...prev, phone: e.target.value } : null)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">LinkedIn</label>
              <Input value={editing.linkedin || ''} onChange={e => setEditing(prev => prev ? { ...prev, linkedin: e.target.value } : null)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Twitter</label>
              <Input value={editing.twitter || ''} onChange={e => setEditing(prev => prev ? { ...prev, twitter: e.target.value } : null)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Instagram</label>
              <Input value={editing.instagram || ''} onChange={e => setEditing(prev => prev ? { ...prev, instagram: e.target.value } : null)} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Quote</label>
            <Input value={editing.quote || ''} onChange={e => setEditing(prev => prev ? { ...prev, quote: e.target.value } : null)} placeholder="Short bio or quote" />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700" disabled={!editing.name || !editing.role}>
              {isNew ? 'Add Member' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={() => { setEditing(null); setIsNew(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Team list */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No team members yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.sort((a, b) => a.sort_order - b.sort_order).map((member, idx) => (
            <div key={member.id} className="flex items-center gap-4 p-4 border rounded-xl bg-card hover:border-orange-500/30 transition-colors group">
              {/* Photo */}
              {member.photo_url ? (
                <img src={member.photo_url} alt={member.name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{member.name}</p>
                <p className="text-sm text-muted-foreground truncate">{member.role}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(member, 'up')} disabled={idx === 0}>
                  ↑
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleMove(member, 'down')} disabled={idx === members.length - 1}>
                  ↓
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing({ ...member }); setIsNew(false); }}>
                  ✏️
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => handleDelete(member)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
