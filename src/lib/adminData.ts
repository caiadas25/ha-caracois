import "server-only";

import { getAdminSupabase } from "@/lib/adminSupabase";
import { SPOT_REQUESTS_TABLE, SPOTS_TABLE } from "@/lib/supabase";
import type { AdminSpotRequest, Spot, SpotRequest } from "@/lib/types";

export async function getPendingSpotRequests(): Promise<AdminSpotRequest[]> {
  const adminSupabase = getAdminSupabase();
  const { data: requests, error } = await adminSupabase
    .from(SPOT_REQUESTS_TABLE)
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const typedRequests = (requests ?? []) as SpotRequest[];
  const spotIds = Array.from(
    new Set(
      typedRequests
        .map((request) => request.spot_id)
        .filter((id): id is string => !!id),
    ),
  );

  if (spotIds.length === 0) {
    return typedRequests.map((request) => ({ ...request, spot: null }));
  }

  const { data: spots, error: spotsError } = await adminSupabase
    .from(SPOTS_TABLE)
    .select("*")
    .in("id", spotIds);

  if (spotsError) throw spotsError;

  const spotsById = new Map(
    ((spots ?? []) as Spot[]).map((spot) => [spot.id, spot]),
  );

  return typedRequests.map((request) => ({
    ...request,
    spot: request.spot_id ? spotsById.get(request.spot_id) ?? null : null,
  }));
}
