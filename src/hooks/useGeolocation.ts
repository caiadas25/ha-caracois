"use client";

import { useCallback, useState } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

// Centro por omissão (Lisboa) quando a geolocalização não está disponível.
export const DEFAULT_CENTER: LatLng = { lat: 38.7223, lng: -9.1393 };
export const CITY_ZOOM = 13;

interface GeolocationState {
  position: LatLng | null;
  loading: boolean;
  denied: boolean;
}

/** Pede a localização do utilizador via API do browser. */
export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: false,
    denied: false,
  });

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState({ position: null, loading: false, denied: true });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          loading: false,
          denied: false,
        });
      },
      () => {
        setState({ position: null, loading: false, denied: true });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  return { ...state, request };
}
