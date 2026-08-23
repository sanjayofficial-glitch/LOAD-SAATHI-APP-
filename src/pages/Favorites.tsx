
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Truck, Package, MapPin, Calendar, IndianRupee, User, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import FavoriteButton from "@/components/FavoriteButton";
import type { Trip, Shipment, User as UserType } from "@/types";

interface FavoriteItem {
  id: string;
  entity_type: "trip" | "shipment" | "user";
  entity_id: string;
  created_at: string;
}

const Favorites = () => {
  const { userProfile, getSupabaseToken } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!userProfile?.id) return;
    try {
      const token = await getSupabaseToken();
      if (!token) throw new Error("No auth token");
      const supabase = createClerkSupabaseClient(token);

      const { data: favs, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userProfile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFavorites(favs || []);

      const tripIds = (favs || []).filter((f) => f.entity_type === "trip").map((f) => f.entity_id);
      const shipmentIds = (favs || []).filter((f) => f.entity_type === "shipment").map((f) => f.entity_id);
      const userIds = (favs || []).filter((f) => f.entity_type === "user").map((f) => f.entity_id);

      if (tripIds.length > 0) {
        const { data } = await supabase
          .from("trips")
          .select("*, trucker:users!trips_trucker_id_fkey(full_name, rating, is_verified)")
          .in("id", tripIds);
        setTrips((data as Trip[]) || []);
      }

      if (shipmentIds.length > 0) {
        const { data } = await supabase
          .from("shipments")
          .select("*, shipper:users(full_name, rating, is_verified)")
          .in("id", shipmentIds);
        setShipments((data as Shipment[]) || []);
      }

      if (userIds.length > 0) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .in("id", userIds);
        setUsers((data as UserType[]) || []);
      }
    } catch (err) {
      console.error("[Favorites] Error:", err);
      showError("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  }, [userProfile?.id, getSupabaseToken]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveAll = async (entityType: string) => {
    if (!userProfile?.id) return;
    try {
      const token = await getSupabaseToken();
      if (!token) return;
      const supabase = createClerkSupabaseClient(token);
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userProfile.id)
        .eq("entity_type", entityType);
      showSuccess("Removed all favorites");
      loadFavorites();
    } catch {
      showError("Failed to remove favorites");
    }
  };

  const tripCount = favorites.filter((f) => f.entity_type === "trip").length;
  const shipmentCount = favorites.filter((f) => f.entity_type === "shipment").length;
  const userCount = favorites.filter((f) => f.entity_type === "user").length;

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="bg-gradient-to-br from-red-500 to-pink-500 p-1.5 rounded-lg shadow-sm">
            <Heart className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Favorites</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your saved trips, shipments, and users
        </p>
      </div>

      <Tabs defaultValue="trips">
        <TabsList className="mb-6">
          <TabsTrigger value="trips" className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5" /> Trips ({tripCount})
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> Shipments ({shipmentCount})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> Users ({userCount})
          </TabsTrigger>
        </TabsList>

        {/* Trips Tab */}
        <TabsContent value="trips">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : trips.length === 0 ? (
            <EmptyState type="trips" />
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleRemoveAll("trip")}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove All
                </Button>
              </div>
              {trips.map((trip) => (
                <Card key={trip.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/trips/${trip.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                          <span className="font-bold text-gray-900 dark:text-white truncate">
                            {trip.origin_city} → {trip.destination_city}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(trip.departure_date).toLocaleDateString()}</span>
                          <span>{trip.available_capacity_tonnes}t capacity</span>
                          <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> ₹{trip.price_per_tonne}/t</span>
                          <span className="capitalize">{trip.status}</span>
                        </div>
                      </Link>
                      <FavoriteButton entityType="trip" entityId={trip.id} userId={userProfile?.id ?? ''} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
            </div>
          ) : shipments.length === 0 ? (
            <EmptyState type="shipments" />
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleRemoveAll("shipment")}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove All
                </Button>
              </div>
              {shipments.map((shipment) => (
                <Card key={shipment.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <Link to={`/shipper/shipments/${shipment.id}`} className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-blue-500 shrink-0" />
                          <span className="font-bold text-gray-900 dark:text-white truncate">
                            {shipment.origin_city} → {shipment.destination_city}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(shipment.departure_date).toLocaleDateString()}</span>
                          <span>{shipment.weight_tonnes}t</span>
                          <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" /> ₹{shipment.budget_per_tonne}/t</span>
                          <span className="capitalize">{shipment.status}</span>
                        </div>
                      </Link>
                      <FavoriteButton entityType="shipment" entityId={shipment.id} userId={userProfile?.id ?? ''} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : users.length === 0 ? (
            <EmptyState type="users" />
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleRemoveAll("user")}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove All
                </Button>
              </div>
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                        {(user.full_name || "U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{user.full_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.user_type} · {user.rating?.toFixed(1) || "New"}</p>
                      </div>
                    </div>
                    <FavoriteButton entityType="user" entityId={user.id} userId={userProfile?.id ?? ''} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

function EmptyState({ type }: { type: string }) {
  return (
    <div className="text-center py-12">
      <Heart className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No saved {type}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Tap the heart icon on any {type.slice(0, -1)} to save it here.
      </p>
    </div>
  );
}

export default Favorites;
