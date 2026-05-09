import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const LOCATION_PROMPTED_KEY = "sharp-cuts-location-prompted";

export type UserCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
};

type LocationStatus = "checking" | "undetermined" | "granted" | "denied" | "error";

type LocationContextValue = {
  status: LocationStatus;
  coordinates: UserCoordinates | null;
  loading: boolean;
  message: string;
  canAskAgain: boolean;
  requestLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  clearMessage: () => void;
};

const LocationContext = createContext<LocationContextValue | null>(null);

function toCoordinates(position: Location.LocationObject): UserCoordinates {
  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
  };
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<LocationStatus>("checking");
  const [coordinates, setCoordinates] = useState<UserCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [canAskAgain, setCanAskAgain] = useState(true);

  const loadCurrentLocation = useCallback(async (showSuccessMessage = false) => {
    setLoading(true);
    try {
      const lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 120000 });
      if (lastKnown) {
        setCoordinates(toCoordinates(lastKnown));
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoordinates(toCoordinates(current));
      setStatus("granted");
      if (showSuccessMessage) {
        setMessage("Lokatsiya aniqlandi. Endi eng yaqin barberlarni ko'rishingiz mumkin.");
      }
    } catch {
      setStatus((value) => (value === "granted" ? value : "error"));
      setMessage("Lokatsiyani aniqlab bo'lmadi. Keyinroq qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }, []);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setMessage("Yaqin atrofdagi barberlarni ko'rsatish uchun lokatsiyangiz kerak.");
    try {
      await AsyncStorage.setItem(LOCATION_PROMPTED_KEY, "true");
      const permission = await Location.requestForegroundPermissionsAsync();
      setCanAskAgain(permission.canAskAgain);

      if (permission.status === Location.PermissionStatus.GRANTED) {
        setStatus("granted");
        await loadCurrentLocation(true);
        return;
      }

      setCoordinates(null);
      setStatus("denied");
      setMessage("Lokatsiya ruxsati berilmadi. Siz baribir barberlarni ko'rishingiz mumkin.");
    } catch {
      setStatus("error");
      setMessage("Lokatsiyani aniqlab bo'lmadi. Keyinroq qayta urinib ko'ring.");
    } finally {
      setLoading(false);
    }
  }, [loadCurrentLocation]);

  const refreshLocation = useCallback(async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    setCanAskAgain(permission.canAskAgain);

    if (permission.status === Location.PermissionStatus.GRANTED) {
      setStatus("granted");
      await loadCurrentLocation(true);
      return;
    }

    await requestLocation();
  }, [loadCurrentLocation, requestLocation]);

  useEffect(() => {
    let mounted = true;

    async function prepareLocation() {
      try {
        const [prompted, permission] = await Promise.all([
          AsyncStorage.getItem(LOCATION_PROMPTED_KEY),
          Location.getForegroundPermissionsAsync(),
        ]);
        if (!mounted) return;

        setCanAskAgain(permission.canAskAgain);

        if (permission.status === Location.PermissionStatus.GRANTED) {
          setStatus("granted");
          await loadCurrentLocation(false);
          return;
        }

        if (!prompted && permission.canAskAgain) {
          await requestLocation();
          return;
        }

        setCoordinates(null);
        setStatus(permission.status === Location.PermissionStatus.DENIED ? "denied" : "undetermined");
        if (prompted) {
          setMessage("Lokatsiya ruxsati berilmadi. Siz baribir barberlarni ko'rishingiz mumkin.");
        }
      } catch {
        if (!mounted) return;
        setStatus("error");
        setMessage("Lokatsiyani aniqlab bo'lmadi. Keyinroq qayta urinib ko'ring.");
      }
    }

    prepareLocation();

    return () => {
      mounted = false;
    };
  }, [loadCurrentLocation, requestLocation]);

  const value = useMemo<LocationContextValue>(
    () => ({
      status,
      coordinates,
      loading,
      message,
      canAskAgain,
      requestLocation,
      refreshLocation,
      clearMessage: () => setMessage(""),
    }),
    [canAskAgain, coordinates, loading, message, refreshLocation, requestLocation, status],
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationStore() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocationStore must be used inside LocationProvider");
  }
  return context;
}
