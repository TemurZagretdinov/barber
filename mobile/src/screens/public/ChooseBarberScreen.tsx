import type { CompositeScreenProps } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ComponentProps } from "react";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { type BarberSort, getPublicBarbers } from "../../api/barbers";
import { BarberCard } from "../../components/BarberCard";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import type { PublicStackParamList, RootStackParamList } from "../../navigation/types";
import type { Barber } from "../../types/barber";

type Props = CompositeScreenProps<
  NativeStackScreenProps<PublicStackParamList, "ChooseBarber">,
  NativeStackScreenProps<RootStackParamList>
>;

type UserLocation = {
  latitude: number;
  longitude: number;
};

type GeoNavigator = {
  geolocation?: {
    getCurrentPosition: (
      success: (position: { coords: { latitude: number; longitude: number } }) => void,
      error: () => void,
      options?: { enableHighAccuracy?: boolean; timeout?: number; maximumAge?: number },
    ) => void;
  };
};

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const sortOptions: Array<{ value: BarberSort; label: string; icon: IoniconName }> = [
  { value: "nearest", label: "Eng yaqin", icon: "location-outline" },
  { value: "cheapest", label: "Eng arzon", icon: "cash-outline" },
  { value: "expensive", label: "Premium", icon: "diamond-outline" },
];

// ─── Scissors Logo ────────────────────────────────────────────────────────────
function ScissorsLogo() {
  const glow = useRef(new Animated.Value(0)).current;

  useCallback(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [])();

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });

  return (
    <View style={logo.container}>
      <Text style={logo.sparkleLeft}>✦</Text>
      <Text style={logo.sparkleRight}>✦</Text>
      <Animated.View style={[logo.iconWrap, { opacity: glowOpacity }]}>
        <View style={logo.crossWrap}>
          <Ionicons name="cut" size={32} color={colors.gold} style={logo.icon1} />
          <Ionicons name="cut" size={26} color={colors.goldLight} style={logo.icon2} />
        </View>
        <View style={logo.poleDot} />
      </Animated.View>
    </View>
  );
}

const logo = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.goldDim,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1600",
  },
  crossWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon1: {
    transform: [{ rotate: "-40deg" }],
    marginRight: -8,
  },
  icon2: {
    transform: [{ rotate: "40deg" }, { scaleX: -1 }],
  },
  poleDot: {
    position: "absolute",
    bottom: 8,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gold,
  },
  sparkleLeft: {
    position: "absolute",
    top: 4,
    left: 8,
    color: colors.gold,
    fontSize: 10,
    opacity: 0.7,
  },
  sparkleRight: {
    position: "absolute",
    top: 2,
    right: 6,
    color: colors.gold,
    fontSize: 12,
    opacity: 0.5,
  },
});

// ─── Gold Divider ─────────────────────────────────────────────────────────────
function GoldDivider() {
  return (
    <View style={divStyle.row}>
      <View style={divStyle.line} />
      <View style={divStyle.dot} />
      <View style={divStyle.line} />
    </View>
  );
}

const divStyle = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  line: { flex: 1, height: 0.8, backgroundColor: colors.goldDim },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.gold, marginHorizontal: 8, opacity: 0.7 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function ChooseBarberScreen({ navigation }: Props) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [sort, setSort] = useState<BarberSort | undefined>();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (sort === "nearest" && !userLocation) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setBarbers(await getPublicBarbers({
        sort,
        userLat: sort === "nearest" ? userLocation?.latitude : undefined,
        userLng: sort === "nearest" ? userLocation?.longitude : undefined,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load barbers");
    } finally {
      setLoading(false);
    }
  }, [sort, userLocation]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  function requestLocation() {
    const geo = (globalThis.navigator as GeoNavigator | undefined)?.geolocation;
    if (!geo) {
      setUserLocation(null);
      setLocationMessage("Lokatsiya ruxsati berilmadi");
      return;
    }
    setLocationMessage("Lokatsiya aniqlanmoqda...");
    geo.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocationMessage("");
      },
      () => {
        setUserLocation(null);
        setLocationMessage("Lokatsiya ruxsati berilmadi");
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }

  function selectSort(nextSort: BarberSort) {
    setSort(nextSort);
    if (nextSort === "nearest") {
      requestLocation();
    } else {
      setLocationMessage("");
    }
  }

  const filtered = search.trim()
    ? barbers.filter((b) =>
        (b.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.specialty || "").toLowerCase().includes(search.toLowerCase())
      )
    : barbers;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Barberlar</Text>
          <Text style={styles.subtitle}>O'zingizga mos ustani tanlang</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("CustomerCabinet")} style={styles.cabinetBtn}>
          <Ionicons name="person-circle-outline" size={28} color={colors.gold} />
        </Pressable>
      </View>

      <GoldDivider />

      {/* Sort Filter chips */}
      <View style={styles.filterPanel}>
        <Pressable
          onPress={() => { setSort(undefined); setLocationMessage(""); }}
          style={[styles.filterChip, !sort && styles.filterChipActive]}
        >
          <Ionicons name="grid-outline" size={14} color={!sort ? "#0A0A0A" : colors.muted} />
          <Text style={[styles.filterText, !sort && styles.filterTextActive]}>Barchasi</Text>
        </Pressable>
        {sortOptions.map((option) => {
          const active = sort === option.value;
          return (
            <Pressable key={option.value} onPress={() => selectSort(option.value)} style={[styles.filterChip, active && styles.filterChipActive]}>
              <Ionicons name={option.icon} size={14} color={active ? "#0A0A0A" : colors.muted} />
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Usta yoki xizmatni qidiring..."
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      {locationMessage ? (
        <View style={styles.locationMsg}>
          <Ionicons name="location-outline" size={14} color={colors.gold} />
          <Text style={styles.locationText}>{locationMessage}</Text>
        </View>
      ) : null}

      {loading ? <ActivityIndicator style={styles.state} color={colors.gold} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
      {!loading && !error && filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cut-outline" size={36} color={colors.muted} />
          <Text style={styles.emptyText}>Barber topilmadi</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {filtered.map((barber) => (
          <BarberCard
            key={barber.id}
            barber={barber}
            onSelect={() => navigation.navigate("SelectService", { barberId: barber.id, barber })}
          />
        ))}
      </View>

      {/* Footer links */}
      <View style={styles.footerLinks}>
        <Pressable onPress={() => navigation.navigate("Login", { role: "barber" })} style={styles.footerLink}>
          <Ionicons name="cut-outline" size={14} color={colors.muted} />
          <Text style={styles.footerLinkText}>Barber Login</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={() => navigation.navigate("Login", { role: "admin" })} style={styles.footerLink}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.muted} />
          <Text style={styles.footerLinkText}>Admin</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable onPress={() => navigation.navigate("Public", { screen: "FindBooking" })} style={styles.footerLink}>
          <Ionicons name="search-outline" size={14} color={colors.muted} />
          <Text style={styles.footerLinkText}>Bron qidirish</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cabinetBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 3,
    fontWeight: "500",
  },
  state: {
    marginVertical: 24,
  },
  filterPanel: {
    marginTop: 14,
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  filterChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  filterText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  filterTextActive: {
    color: "#0A0A0A",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.soft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    minHeight: 50,
    marginTop: 14,
    gap: 10,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  locationMsg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#1A1200",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#3A2800",
  },
  locationText: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "#1A0000",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#3A1010",
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  emptyBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 15,
  },
  list: {
    marginTop: 20,
    gap: 12,
  },
  footerLinks: {
    marginTop: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    paddingBottom: 8,
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerLinkText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: colors.line,
  },
});
