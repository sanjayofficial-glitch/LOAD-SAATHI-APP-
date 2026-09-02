import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, UserCheck, UserX, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { User } from '@/types';

const UserManagement = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [verifying, setVerifying] = useState<Record<string, boolean>>({});

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
        .select('id, user_type, full_name, phone, rating, total_trips, is_verified, created_at')
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

  const toggleVerification = async (user: User) => {
    setVerifying(prev => ({ ...prev, [user.id]: true }));
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('users')
        .update({ is_verified: !user.is_verified })
        .eq('id', user.id);

      if (error) throw error;

      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, is_verified: !u.is_verified } : u
        )
      );
      toast.success(`${user.full_name} ${user.is_verified ? 'hidden' : 'visible'}`);
    } catch (err) {
      console.error('Error toggling verification:', err);
      toast.error('Failed to update user');
    } finally {
      setVerifying(prev => ({ ...prev, [user.id]: false }));
    }
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
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers}>
          Refresh
        </Button>
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

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-center">Rating</TableHead>
              <TableHead className="text-center">Trips</TableHead>
              <TableHead className="text-center">Verified</TableHead>
              <TableHead className="text-center">Joined</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No users found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map(user => (
                <TableRow key={user.id}>
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
                  <TableCell className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Switch
                        checked={user.is_verified}
                        disabled={verifying[user.id]}
                        onCheckedChange={() => toggleVerification(user)}
                      />
                      <span className="text-xs text-gray-400 dark:text-gray-500 w-16">
                        {verifying[user.id] ? (
                          <Loader2 className="h-3 w-3 animate-spin inline" />
                        ) : user.is_verified ? (
                          'Verified'
                        ) : (
                          'Unverified'
                        )}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserManagement;
