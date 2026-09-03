import { useCallback } from "react";
import { useAuth as useClerkAuth } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClerkSupabaseClient } from "@/utils/supabaseClient";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { showError } from "@/utils/toast";
import { posthog } from "@/utils/posthog";

interface FavoriteButtonProps {
  entityType: "trip" | "shipment" | "user";
  entityId: string;
  userId: string;
  className?: string;
  size?: number;
  onToggled?: () => void;
}

export default function FavoriteButton({ entityType, entityId, userId, className = "", size = 18, onToggled }: FavoriteButtonProps) {
  const { getToken } = useClerkAuth();
  const queryClient = useQueryClient();
  const queryKey = ["favorite", userId, entityType, entityId];

  const { data: isFavorited = false } = useQuery({
    queryKey,
    queryFn: async () => {
      const token = await getToken({ template: "supabase" });
      if (!token) return false;
      const supabase = createClerkSupabaseClient(token);
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .maybeSingle();
      return !!data;
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (currentlyFavorited: boolean) => {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Not authenticated");
      const supabase = createClerkSupabaseClient(token);

      if (currentlyFavorited) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("entity_type", entityType)
          .eq("entity_id", entityId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert({
          user_id: userId,
          entity_type: entityType,
          entity_id: entityId,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_data, currentlyFavorited) => {
      queryClient.setQueryData(queryKey, !currentlyFavorited);
      posthog.capture("favorite_updated", {
        entity_type: entityType,
        action: currentlyFavorited ? "removed" : "added",
      });
      onToggled?.();
    },
    onError: (error, currentlyFavorited) => {
      posthog.captureException(error, { flow: "update_favorite", entity_type: entityType });
      queryClient.setQueryData(queryKey, currentlyFavorited);
      showError("Failed to update favorite");
    },
  });

  const toggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (toggleMutation.isPending) return;
      toggleMutation.mutate(isFavorited);
    },
    [isFavorited, toggleMutation]
  );

  return (
    <button
      onClick={toggle}
      disabled={toggleMutation.isPending}
      className={cn(
        "p-1.5 rounded-full transition-all hover:bg-gray-100 dark:hover:bg-gray-800",
        isFavorited && "text-red-500",
        !isFavorited && "text-gray-300 dark:text-gray-600 hover:text-red-400",
        className
      )}
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={size}
        className={cn("transition-all", isFavorited && "fill-current")}
      />
    </button>
  );
}
