import { useEffect, useState, useMemo } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, Ban, Shield, Truck, Package, MessageSquare } from 'lucide-react';
import VerificationBadge from '@/components/VerificationBadge';
import type { User, Trip, Shipment, Request, Review, Message } from '@/types';

interface UserDetailDrawerProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserDetailDrawer = ({ userId, open, onOpenChange }: UserDetailDrawerProps) => {
  const { getAuthenticatedClient } = useSupabase();
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true);
    let cancelled = false;

    const fetchData = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        const [userRes, tripsRes, shipmentsRes, requestsRes, reviewsRes, messagesRes] = await Promise.all([
          supabase.from('users').select('*').eq('id', userId).single(),
          supabase.from('trips').select('*').eq('trucker_id', userId).order('created_at', { ascending: false }),
          supabase.from('shipments').select('*').eq('shipper_id', userId).order('created_at', { ascending: false }),
          supabase.from('requests').select('*, trip:trips(*), shipment:shipments(*)').or(`shipper_id.eq.${userId},receiver_id.eq.${userId}`).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*, trip:trips(*)').or(`trucker_id.eq.${userId},shipper_id.eq.${userId}`).order('created_at', { ascending: false }),
          supabase.from('messages').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: false }).limit(50),
        ]);

        if (!cancelled) {
          if (userRes.data) setUser(userRes.data as unknown as User);
          if (tripsRes.data) setTrips(tripsRes.data as unknown as Trip[]);
          if (shipmentsRes.data) setShipments(shipmentsRes.data as unknown as Shipment[]);
          if (requestsRes.data) setRequests(requestsRes.data as unknown as Request[]);
          if (reviewsRes.data) setReviews(reviewsRes.data as unknown as Review[]);
          if (messagesRes.data) setMessages(messagesRes.data as unknown as Message[]);
        }
      } catch (err) {
        console.error('Error fetching user details:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [open, userId, getAuthenticatedClient]);

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-slate-950 border-slate-700/60 text-slate-50">
        <SheetHeader className="pb-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-white flex items-center gap-2">
                  {user.full_name}
                  <VerificationBadge isVerified={user.is_verified} size="md" />
                </SheetTitle>
                <SheetDescription className="text-slate-400 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] border-slate-600 text-slate-300">
                    {user.user_type}
                  </Badge>
                  {user.suspended && (
                    <Badge variant="outline" className="text-[10px] border-red-600 text-red-400 bg-red-900/20">
                      <Ban className="h-3 w-3 mr-1" /> Suspended
                    </Badge>
                  )}
                </SheetDescription>
              </div>
            </div>
          ) : null}
        </SheetHeader>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : user ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-slate-900 border-slate-700/60">
                <CardContent className="p-3">
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Rating</p>
                  <div className="flex items-center gap-1 mt-1">
                    {avgRating ? (
                      <>
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-mono font-bold text-white">{avgRating}</span>
                        <span className="text-[10px] text-slate-400">({reviews.length})</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-500">No reviews</span>
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-700/60">
                <CardContent className="p-3">
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-wider">Trips</p>
                  <p className="text-lg font-mono font-bold text-white">{user.total_trips || 0}</p>
                </CardContent>
              </Card>
            </div>

            {user.suspended && user.suspended_reason && (
              <Card className="bg-red-900/20 border-red-700/60">
                <CardContent className="p-3">
                  <p className="text-[10px] text-red-400 uppercase font-black tracking-wider">Suspension Reason</p>
                  <p className="text-xs text-red-300 mt-1">{user.suspended_reason}</p>
                  {user.suspended_at && (
                    <p className="text-[10px] text-red-400 mt-1">{new Date(user.suspended_at).toLocaleString()}</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Section title="Trips" icon={<Truck className="h-3.5 w-3.5 text-orange-400" />} count={trips.length}>
              {trips.length === 0 ? (
                <Empty text="No trips posted" />
              ) : (
                <div className="space-y-2">
                  {trips.slice(0, 10).map(trip => (
                    <div key={trip.id} className="text-xs p-2 bg-slate-800/50 rounded border border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-200">{trip.origin_city} → {trip.destination_city}</span>
                        <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">{trip.status}</Badge>
                      </div>
                      <span className="text-slate-500">{trip.vehicle_type} · {trip.available_capacity_tonnes}t · ₹{trip.price_per_tonne}/t</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Shipments" icon={<Package className="h-3.5 w-3.5 text-purple-400" />} count={shipments.length}>
              {shipments.length === 0 ? (
                <Empty text="No shipments posted" />
              ) : (
                <div className="space-y-2">
                  {shipments.slice(0, 10).map(s => (
                    <div key={s.id} className="text-xs p-2 bg-slate-800/50 rounded border border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-200">{s.goods_description}</span>
                        <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">{s.status}</Badge>
                      </div>
                      <span className="text-slate-500">{s.origin_city} → {s.destination_city} · {s.weight_tonnes}t</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Recent Requests" icon={<Shield className="h-3.5 w-3.5 text-blue-400" />} count={requests.length}>
              {requests.length === 0 ? (
                <Empty text="No requests" />
              ) : (
                <div className="space-y-2">
                  {requests.slice(0, 10).map(r => (
                    <div key={r.id} className="text-xs p-2 bg-slate-800/50 rounded border border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-200">Request {r.status}</span>
                        <span className="text-[10px] text-slate-500">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-slate-500">{r.goods_description} · {r.weight_tonnes}t</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Reviews" icon={<Star className="h-3.5 w-3.5 text-yellow-400" />} count={reviews.length}>
              {reviews.length === 0 ? (
                <Empty text="No reviews yet" />
              ) : (
                <div className="space-y-2">
                  {reviews.slice(0, 10).map(r => (
                    <div key={r.id} className="text-xs p-2 bg-slate-800/50 rounded border border-slate-700/50">
                      <div className="flex items-center gap-1 mb-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3 w-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
                        ))}
                        <span className="text-slate-400 ml-1">{r.rating}/5</span>
                      </div>
                      {r.comment && <p className="text-slate-300">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </Section>

            <Section title="Recent Messages" icon={<MessageSquare className="h-3.5 w-3.5 text-green-400" />} count={messages.length}>
              {messages.length === 0 ? (
                <Empty text="No messages" />
              ) : (
                <div className="space-y-2">
                  {messages.slice(0, 10).map(m => (
                    <div key={m.id} className="text-xs p-2 bg-slate-800/50 rounded border border-slate-700/50">
                      <p className="text-slate-300 line-clamp-2">{m.content}</p>
                      <span className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
};

function Section({ title, icon, count, children }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-300">{title}</h3>
        <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">{count}</Badge>
      </div>
      {children}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="text-xs text-slate-500 py-2">{text}</p>;
}

export default UserDetailDrawer;
