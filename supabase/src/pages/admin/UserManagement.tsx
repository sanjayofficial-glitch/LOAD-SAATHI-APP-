import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, UserCheck, UserX, Star, Loader2, Eye, Download, Ban, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';
import { recordAudit } from '@/lib/adminAudit';
import { toCSV, downloadCSV, CSV_MAX_ROWS } from '@/lib/csvExport';
import UserDetailDrawer from './UserDetailDrawer';

const UserManagement = () => {
  const { getAuthenticatedClient } = useSupabase();
  const { selected, toggle, selectAll, clear, count } = useBulkSelection<User>();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bulkSuspendDialogOpen, setBulkSuspendDialogOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const supabase = await getAuthenticatedClient();
      const { data, error } = await supabase
        .from('users')
        .select('id, user_type, full_name, phone, rating, total_trips, is_verified, suspended, suspended_reason, suspended_at, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers((data || []) as unknown as User[]);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (user: User) => {
    setDrawerUserId(user.id);
    setDrawerOpen(true);
  };

  const toggleVerification = async (user: User) => {
    setVerifying(prev => ({ ...prev, [user.id]: true }));
    try {
      const supabase = await getAuthenticatedClient();
      const newValue = !user.is_verified;
      const { error } = await supabase
        .from('users')
        .update({ is_verified: newValue })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, is_verified: newValue } : u
        )
      );
      toast.success(`${user.full_name} ${newValue ? 'verified' : 'unverified'}`);

      await recordAudit(supabase, {
        action: newValue ? 'user.verify' : 'user.unverify',
        targetType: 'user',
        targetId: user.id,
        metadata: { full_name: user.full_name },
      });
    } catch (err) {
      console.error('Error toggling verification:', err);
      toast.error('Failed to update user');
    } finally {
      setVerifying(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const bulkVerify = async () => {
    if (count === 0) return;
    const selectedUsers = users.filter(u => selected.has(u.id));
    try {
      const supabase = await getAuthenticatedClient();
      const updates = selectedUsers.map(u => supabase
        .from('users')
        .update({ is_verified: true })
        .eq('id', u.id)
      );
      const results = await Promise.allSettled(updates);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      setUsers(prev =>
        prev.map(u =>
          selected.has(u.id) && results.find(r => (r as PromiseSettledResult<unknown>).status === 'fulfilled')
            ? { ...u, is_verified: true }
            : u
        )
      );

      if (succeeded > 0) {
        await recordAudit(supabase, {
          action: 'bulk.verify',
          targetType: 'user',
          metadata: { count: succeeded, user_ids: selectedUsers.map(u => u.id) },
        });
      }

      toast.success(`Verified ${succeeded} users${failed > 0 ? `, ${failed} failed` : ''}`);
      clear();
    } catch (err) {
      console.error('Error bulk verifying:', err);
      toast.error('Failed to bulk verify users');
    }
  };

  const bulkSuspend = async () => {
    if (count === 0 || !suspendReason.trim()) return;
    const selectedUsers = users.filter(u => selected.has(u.id));
    try {
      const supabase = await getAuthenticatedClient();
      const updates = selectedUsers.map(u => supabase
        .from('users')
        .update({ suspended: true, suspended_reason: suspendReason.trim(), suspended_at: new Date().toISOString() })
        .eq('id', u.id)
      );
      const results = await Promise.allSettled(updates);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;

      setUsers(prev =>
        prev.map(u =>
          selected.has(u.id) && results.find(r => (r as PromiseSettledResult<unknown>).status === 'fulfilled')
            ? { ...u, suspended: true, suspended_reason: suspendReason.trim(), suspended_at: new Date().toISOString() }
            : u
        )
      );

      if (succeeded > 0) {
        await recordAudit(supabase, {
          action: 'user.suspend',
          targetType: 'user',
          metadata: { count: succeeded, reason: suspendReason.trim(), user_ids: selectedUsers.map(u => u.id) },
        });
      }

      toast.success(`Suspended ${succeeded} users`);
      setBulkSuspendDialogOpen(false);
      setSuspendReason('');
      clear();
    } catch (err) {
      console.error('Error bulk suspending:', err);
      toast.error('Failed to suspend users');
    }
  };

  const exportCSV = async () => {
    const rows = filteredUsers.map(u => ({
      id: u.id,
      full_name: u.full_name,
      user_type: u.user_type,
      phone: u.phone || '',
      rating: u.rating,
      total_trips: u.total_trips,
      is_verified: u.is_verified ? 'Yes' : 'No',
      suspended: u.suspended ? 'Yes' : 'No',
      created_at: u.created_at,
    }));
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'full_name', label: 'Full Name' },
      { key: 'user_type', label: 'Role' },
      { key: 'phone', label: 'Phone' },
      { key: 'rating', label: 'Rating' },
      { key: 'total_trips', label: 'Trips' },
      { key: 'is_verified', label: 'Verified' },
      { key: 'suspended', label: 'Suspended' },
      { key: 'created_at', label: 'Joined' },
    ];
    const csv = toCSV(rows, columns);
    downloadCSV(`users-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(`Exported ${Math.min(rows.length, CSV_MAX_ROWS)} users to CSV`);

    const supabase = await getAuthenticatedClient();
    await recordAudit(supabase, {
      action: 'export.csv',
      targetType: 'user',
      metadata: { count: rows.length },
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.phone?.includes(search);
    const matchesRole = roleFilter === 'all' || user.user_type === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-800">Admin</Badge>;
      case 'trucker':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:border-blue-800">Trucker</Badge>;
      case 'shipper':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/30 dark:border-green-800">Shipper</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} className="shrink-0">
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="shrink-0">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <Input
            placeholder="Search by name, email, company, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="trucker">Trucker</SelectItem>
            <SelectItem value="shipper">Shipper</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {count > 0 && (
        <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <span className="text-sm text-orange-700 dark:text-orange-300 font-medium">
            {count} user{count !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button size="sm" onClick={bulkVerify} className="bg-green-600 hover:bg-green-700 text-white">
              <CheckCheck className="h-4 w-4 mr-1" />
              Verify Selected
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkSuspendDialogOpen(true)}>
              <Ban className="h-4 w-4 mr-1" />
              Suspend Selected
            </Button>
            <Button size="sm" variant="ghost" onClick={clear}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={filteredUsers.length > 0 && count === filteredUsers.length}
                  onCheckedChange={(checked) => {
                    if (checked) selectAll(filteredUsers);
                    else clear();
                  }}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead className="text-center">Trips</TableHead>
              <TableHead className="text-center">Verified</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Joined</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No users found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id} className="cursor-pointer" onClick={() => openDrawer(user)}>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(user.id)}
                      onCheckedChange={() => toggle(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.full_name}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.user_type)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{user.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-600 dark:text-gray-300">
                    {user.total_trips || 0}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.is_verified ? (
                      <UserCheck className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <UserX className="h-4 w-4 text-gray-300 mx-auto" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {user.suspended ? (
                      <Badge variant="outline" className="text-red-400 border-red-600 bg-red-900/20">
                        <Ban className="h-3 w-3 mr-1" />
                        Suspended
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-400 border-green-600 bg-green-900/20">
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDrawer(user)} className="text-blue-600 hover:text-blue-700">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={user.is_verified || false}
                        disabled={verifying[user.id]}
                        onCheckedChange={() => toggleVerification(user)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserDetailDrawer
        userId={drawerUserId}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />

      <AlertDialog open={bulkSuspendDialogOpen} onOpenChange={setBulkSuspendDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {count} users?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Please provide a reason for suspending these users. This will be recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="Suspension reason..."
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
            className="bg-slate-800 border-slate-700 text-slate-200"
          />
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkSuspend}
              disabled={!suspendReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              Suspend {count} Users
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;
