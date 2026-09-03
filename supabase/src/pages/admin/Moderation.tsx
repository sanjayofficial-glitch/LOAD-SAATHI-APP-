import { useEffect, useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Search, Truck, Package, Loader2, XCircle, Ban, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Trip, Shipment } from '@/types';
import { recordAudit } from '@/lib/adminAudit';
import { toCSV, downloadCSV, CSV_MAX_ROWS } from '@/lib/csvExport';

const Moderation = () => {
  const { getAuthenticatedClient } = useSupabase();
  const tripBulk = useBulkSelection<Trip>();
  const shipmentBulk = useBulkSelection<Shipment>();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tripSearch, setTripSearch] = useState('');
  const [tripStatusFilter, setTripStatusFilter] = useState<string>('all');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<string>('all');
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [tripBulkDialogOpen, setTripBulkDialogOpen] = useState(false);
  const [shipmentBulkDialogOpen, setShipmentBulkDialogOpen] = useState(false);

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
      tripBulk.clear();
      shipmentBulk.clear();
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

      await recordAudit(supabase, {
        action: 'trip.cancel',
        targetType: 'trip',
        targetId: trip.id,
        metadata: { origin_city: trip.origin_city, destination_city: trip.destination_city },
      });
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

      await recordAudit(supabase, {
        action: 'shipment.cancel',
        targetType: 'shipment',
        targetId: shipment.id,
        metadata: { goods_description: shipment.goods_description, origin_city: shipment.origin_city, destination_city: shipment.destination_city },
      });
    } catch (err) {
      console.error('Error cancelling shipment:', err);
      toast.error('Failed to cancel shipment');
    }
  };

  const bulkCancelTrips = async () => {
    if (tripBulk.count === 0) return;
    const selectedTrips = trips.filter(t => tripBulk.selected.has(t.id));
    try {
      const supabase = await getAuthenticatedClient();
      const updates = selectedTrips.map(t =>
        supabase.from('trips').update({ status: 'cancelled' }).eq('id', t.id)
      );
      const results = await Promise.allSettled(updates);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;

      setTrips(prev =>
        prev.map(t =>
          tripBulk.selected.has(t.id) && results.find(r => (r as PromiseSettledResult<unknown>).status === 'fulfilled')
            ? { ...t, status: 'cancelled' as const }
            : t
        )
      );

      if (succeeded > 0) {
        await recordAudit(supabase, {
          action: 'bulk.cancel_trips',
          targetType: 'trip',
          metadata: { count: succeeded, trip_ids: selectedTrips.map(t => t.id) },
        });
      }

      toast.success(`Cancelled ${succeeded} trips`);
      setTripBulkDialogOpen(false);
      tripBulk.clear();
    } catch (err) {
      console.error('Error bulk cancelling trips:', err);
      toast.error('Failed to cancel trips');
    }
  };

  const bulkCancelShipments = async () => {
    if (shipmentBulk.count === 0) return;
    const selectedShipments = shipments.filter(s => shipmentBulk.selected.has(s.id));
    try {
      const supabase = await getAuthenticatedClient();
      const updates = selectedShipments.map(s =>
        supabase.from('shipments').update({ status: 'cancelled' }).eq('id', s.id)
      );
      const results = await Promise.allSettled(updates);
      const succeeded = results.filter(r => r.status === 'fulfilled').length;

      setShipments(prev =>
        prev.map(s =>
          shipmentBulk.selected.has(s.id) && results.find(r => (r as PromiseSettledResult<unknown>).status === 'fulfilled')
            ? { ...s, status: 'cancelled' as const }
            : s
        )
      );

      if (succeeded > 0) {
        await recordAudit(supabase, {
          action: 'bulk.cancel_shipments',
          targetType: 'shipment',
          metadata: { count: succeeded, shipment_ids: selectedShipments.map(s => s.id) },
        });
      }

      toast.success(`Cancelled ${succeeded} shipments`);
      setShipmentBulkDialogOpen(false);
      shipmentBulk.clear();
    } catch (err) {
      console.error('Error bulk cancelling shipments:', err);
      toast.error('Failed to cancel shipments');
    }
  };

  const exportTripsCSV = () => {
    const rows = filteredTrips.map(t => ({
      id: t.id,
      origin_city: t.origin_city,
      destination_city: t.destination_city,
      vehicle_type: t.vehicle_type,
      vehicle_number: t.vehicle_number,
      capacity_tonnes: t.available_capacity_tonnes,
      price_per_tonne: t.price_per_tonne,
      departure_date: t.departure_date,
      status: t.status,
      created_at: t.created_at,
    }));
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'origin_city', label: 'Origin' },
      { key: 'destination_city', label: 'Destination' },
      { key: 'vehicle_type', label: 'Vehicle' },
      { key: 'vehicle_number', label: 'Vehicle No.' },
      { key: 'capacity_tonnes', label: 'Capacity (t)' },
      { key: 'price_per_tonne', label: 'Price/t (₹)' },
      { key: 'departure_date', label: 'Departure' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created' },
    ];
    const csv = toCSV(rows, columns);
    downloadCSV(`trips-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(`Exported ${Math.min(rows.length, CSV_MAX_ROWS)} trips to CSV`);

    getAuthenticatedClient().then(supabase => {
      recordAudit(supabase, {
        action: 'export.csv',
        targetType: 'trip',
        metadata: { count: rows.length },
      });
    });
  };

  const exportShipmentsCSV = () => {
    const rows = filteredShipments.map(s => ({
      id: s.id,
      goods_description: s.goods_description,
      origin_city: s.origin_city,
      destination_city: s.destination_city,
      weight_tonnes: s.weight_tonnes,
      budget_per_tonne: s.budget_per_tonne,
      departure_date: s.departure_date,
      status: s.status,
      created_at: s.created_at,
    }));
    const columns = [
      { key: 'id', label: 'ID' },
      { key: 'goods_description', label: 'Goods' },
      { key: 'origin_city', label: 'Origin' },
      { key: 'destination_city', label: 'Destination' },
      { key: 'weight_tonnes', label: 'Weight (t)' },
      { key: 'budget_per_tonne', label: 'Budget/t (₹)' },
      { key: 'departure_date', label: 'Departure' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created' },
    ];
    const csv = toCSV(rows, columns);
    downloadCSV(`shipments-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(`Exported ${Math.min(rows.length, CSV_MAX_ROWS)} shipments to CSV`);

    getAuthenticatedClient().then(supabase => {
      recordAudit(supabase, {
        action: 'export.csv',
        targetType: 'shipment',
        metadata: { count: rows.length },
      });
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
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
            <Button variant="outline" size="sm" onClick={exportTripsCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>

          {tripBulk.count > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                {tripBulk.count} trip{tripBulk.count !== 1 ? 's' : ''} selected
              </span>
              <Button size="sm" variant="destructive" onClick={() => setTripBulkDialogOpen(true)} className="ml-auto">
                <Ban className="h-4 w-4 mr-1" />
                Cancel Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={tripBulk.clear}>Cancel</Button>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredTrips.length > 0 && tripBulk.count === filteredTrips.length}
                      onCheckedChange={(checked) => {
                        if (checked) tripBulk.selectAll(filteredTrips);
                        else tripBulk.clear();
                      }}
                    />
                  </TableHead>
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
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No trips found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrips.map(trip => (
                    <TableRow key={trip.id}>
                      <TableCell>
                        <Checkbox
                          checked={tripBulk.selected.has(trip.id)}
                          onCheckedChange={() => tripBulk.toggle(trip.id)}
                        />
                      </TableCell>
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
            <Button variant="outline" size="sm" onClick={exportShipmentsCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>

          {shipmentBulk.count > 0 && (
            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <span className="text-sm text-red-700 dark:text-red-300 font-medium">
                {shipmentBulk.count} shipment{shipmentBulk.count !== 1 ? 's' : ''} selected
              </span>
              <Button size="sm" variant="destructive" onClick={() => setShipmentBulkDialogOpen(true)} className="ml-auto">
                <Ban className="h-4 w-4 mr-1" />
                Cancel Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={shipmentBulk.clear}>Cancel</Button>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredShipments.length > 0 && shipmentBulk.count === filteredShipments.length}
                      onCheckedChange={(checked) => {
                        if (checked) shipmentBulk.selectAll(filteredShipments);
                        else shipmentBulk.clear();
                      }}
                    />
                  </TableHead>
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
                    <TableCell colSpan={8} className="text-center py-12 text-gray-500 dark:text-gray-400">
                      No shipments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredShipments.map(shipment => (
                    <TableRow key={shipment.id}>
                      <TableCell>
                        <Checkbox
                          checked={shipmentBulk.selected.has(shipment.id)}
                          onCheckedChange={() => shipmentBulk.toggle(shipment.id)}
                        />
                      </TableCell>
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

      <AlertDialog open={tripBulkDialogOpen} onOpenChange={setTripBulkDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {tripBulk.count} trips?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will cancel {tripBulk.count} trip{tripBulk.count !== 1 ? 's' : ''} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Keep Trips</AlertDialogCancel>
            <AlertDialogAction onClick={bulkCancelTrips} className="bg-red-600 hover:bg-red-700">
              Cancel {tripBulk.count} Trips
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={shipmentBulkDialogOpen} onOpenChange={setShipmentBulkDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700 text-slate-50">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {shipmentBulk.count} shipments?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will cancel {shipmentBulk.count} shipment{shipmentBulk.count !== 1 ? 's' : ''} and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300">Keep Shipments</AlertDialogCancel>
            <AlertDialogAction onClick={bulkCancelShipments} className="bg-red-600 hover:bg-red-700">
              Cancel {shipmentBulk.count} Shipments
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Moderation;
