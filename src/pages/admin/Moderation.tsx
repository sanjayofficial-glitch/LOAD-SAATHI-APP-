import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Search, Truck, Package, Loader2, XCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip, Shipment } from '@/types';

const Moderation = () => {
  const { getAuthenticatedClient } = useSupabase();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState<string>('all');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<string>('all');
  const [shipmentSearch, setShipmentSearch] = useState('');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const supabase = await getAuthenticatedClient();

      const [tripsRes, shipmentsRes] = await Promise.all([
        supabase.from('trips').select('id, origin_city, destination_city, available_capacity_tonnes, price_per_tonne, departure_date, status, trucker_id, created_at, vehicle_type, vehicle_number').order('created_at', { ascending: false }),
        supabase.from('shipments').select('id, origin_city, destination_city, goods_description, weight_tonnes, budget_per_tonne, departure_date, status, shipper_id, created_at, pickup_address, delivery_address').order('created_at', { ascending: false }),
      ]);

      if (tripsRes.error) throw tripsRes.error;
      if (shipmentsRes.error) throw shipmentsRes.error;

      setTrips(tripsRes.data || []);
      setShipments(shipmentsRes.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const cancelTrip = async (trip: Trip) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('trips')
        .update({ status: 'cancelled' })
        .eq('id', trip.id);

      if (error) throw error;

      setTrips(prev =>
        prev.map(t => (t.id === trip.id ? { ...t, status: 'cancelled' as const } : t))
      );
      toast.success(`Trip to ${trip.destination_city} cancelled`);
    } catch (err) {
      console.error('Error cancelling trip:', err);
      toast.error('Failed to cancel trip');
    }
  };

  const cancelShipment = async (shipment: Shipment) => {
    try {
      const supabase = await getAuthenticatedClient();
      const { error } = await supabase
        .from('shipments')
        .update({ status: 'cancelled' })
        .eq('id', shipment.id);

      if (error) throw error;

      setShipments(prev =>
        prev.map(s => (s.id === shipment.id ? { ...s, status: 'cancelled' as const } : s))
      );
      toast.success(`Shipment of ${shipment.goods_description} cancelled`);
    } catch (err) {
      console.error('Error cancelling shipment:', err);
      toast.error('Failed to cancel shipment');
    }
  };

  const getTripStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getShipmentStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">Pending</Badge>;
      case 'matched':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800">Matched</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch =
      trip.origin_city?.toLowerCase().includes(tripSearch.toLowerCase()) ||
      trip.destination_city?.toLowerCase().includes(tripSearch.toLowerCase()) ||
      trip.vehicle_number?.toLowerCase().includes(tripSearch.toLowerCase());
    const matchesStatus = tripStatusFilter === 'all' || trip.status === tripStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch =
      shipment.goods_description?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      shipment.origin_city?.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
      shipment.destination_city?.toLowerCase().includes(shipmentSearch.toLowerCase());
    const matchesStatus = shipmentStatusFilter === 'all' || shipment.status === shipmentStatusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review and manage trips and shipments across the platform
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="trips" className="w-full">
        <TabsList>
          <TabsTrigger value="trips" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Trips ({trips.length})
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Shipments ({shipments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trips" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by city or vehicle number..."
                value={tripSearch}
                onChange={e => setTripSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={tripStatusFilter} onValueChange={setTripStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Price/Tonne</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No trips found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map(trip => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {trip.origin_city} → {trip.destination_city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{trip.vehicle_type}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{trip.vehicle_number}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {trip.available_capacity_tonnes}t
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        ₹{trip.price_per_tonne}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(trip.departure_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getTripStatusBadge(trip.status)}</TableCell>
                      <TableCell className="text-center">
                        {trip.status === 'active' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30">
                                <Ban className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel this trip?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel the trip from {trip.origin_city} to{' '}
                                  {trip.destination_city}. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Trip</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelTrip(trip)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Trip
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {trip.status === 'cancelled' && (
                          <Badge variant="outline" className="text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelled
                          </Badge>
                        )}
                        {trip.status === 'completed' && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No action needed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="shipments" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search by goods, city, or description..."
                value={shipmentSearch}
                onChange={e => setShipmentSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={shipmentStatusFilter} onValueChange={setShipmentStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="matched">Matched</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goods</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Budget/Tonne</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipments.map(shipment => (
                    <TableRow key={shipment.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shipment.goods_description}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {shipment.origin_city} → {shipment.destination_city}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        {shipment.weight_tonnes}t
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                        ₹{shipment.budget_per_tonne}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(shipment.departure_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getShipmentStatusBadge(shipment.status)}</TableCell>
                      <TableCell className="text-center">
                        {(shipment.status === 'pending' || shipment.status === 'matched') && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30">
                                <Ban className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel this shipment?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will cancel the shipment of {shipment.goods_description} from{' '}
                                  {shipment.origin_city} to {shipment.destination_city}. This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Keep Shipment</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => cancelShipment(shipment)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Cancel Shipment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        {shipment.status === 'cancelled' && (
                          <Badge variant="outline" className="text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700">
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancelled
                          </Badge>
                        )}
                        {shipment.status === 'completed' && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">No action needed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Moderation;
