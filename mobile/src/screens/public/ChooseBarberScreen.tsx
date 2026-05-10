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
import { EmptyState, ErrorState, LoadingState } from "../../components/States";
import { ThemeToggle } from "../../components/ThemeToggle";
import type { PublicStackParamList, RootStackParamList } from "../../navigation/types";
import { useLocationStore } from "../../store/locationStore";
import { useTheme } from "../../theme/theme";
import type { Barber } from "../../types/barber";

type Props = CompositeScreenProps<
  NativeStackScreenProps<PublicStackParamList, "ChooseBarber">,
  NativeStackScreenProps<RootStackParamList>
>;

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
export function ChooseBarberScreen({ navigation, route }: Props) {
  const bookingSource = route.params?.bookingSource ?? "public";
  const { theme } = useTheme();
  const location = useLocationStore();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [sort, setSort] = useState<BarberSort | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const nearestCoordinates = sort === "nearest" ? location.coordinates : null;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const coordinates = nearestCoordinates;
    const shouldUseNearest = sort === "nearest" && coordinates;
    try {
      setBarbers(await getPublicBarbers({
        sort: shouldUseNearest ? "nearest" : sort === "nearest" ? undefined : sort,
        userLat: shouldUseNearest ? coordinates.latitude : undefined,
        userLng: shouldUseNearest ? coordinates.longitude : undefined,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load barbers");
    } finally {
      setLoading(false);
    }
  }, [nearestCoordinates, sort]);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  function selectSort(nextSort: BarberSort) {
    setSort(nextSort);
    if (nextSort === "nearest" && !location.coordinates) {
      void location.requestLocation();
    }
  }

  const filtered = search.trim()
    ? barbers.filter((b) =>
        (b.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (b.specialty || "").toLowerCase().includes(search.toLowerCase())
      )
    : barbers;
  const activeInk = theme.colors.onGold;
  const showLocationBadge = sort === "nearest" || Boolean(location.message) || Boolean(location.coordinates);
  const locationText = location.coordinates
    ? sort === "nearest"
      ? "Eng yaqin barberlar"
      : "Lokatsiya aniqlandi"
    : location.loading
      ? "Lokatsiya aniqlanmoqda..."
      : "Lokatsiyani yoqish";
  const locationDetail = location.coordinates
    ? "Masofa bo'yicha saralash tayyor."
    : location.message || "Eng yaqin barberlarni ko'rish uchun lokatsiyani yoqing.";

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: theme.colors.text }]}>Barberlar</Text>
          <Text style={[styles.subtitle, { color: theme.colors.muted }]}>O'zingizga mos ustani tanlang</Text>
        </View>
        <View style={styles.headerActions}>
          <ThemeToggle compact />
          <Pressable
            onPress={() => navigation.navigate("CustomerCabinet")}
            style={[styles.cabinetBtn, { backgroundColor: theme.colors.input, borderColor: theme.colors.goldDim }]}
          >
            <Ionicons name="person-circle-outline" size={28} color={theme.colors.gold} />
          </Pressable>
        </View>
      </View>

      <View style={divStyle.row}>
        <View style={[divStyle.line, { backgroundColor: theme.colors.goldDim }]} />
        <View style={[divStyle.dot, { backgroundColor: theme.colors.gold }]} />
        <View style={[divStyle.line, { backgroundColor: theme.colors.goldDim }]} />
      </View>

      {/* Sort Filter chips */}
      <View style={styles.filterPanel}>
        <Pressable
          onPress={() => setSort(undefined)}
          style={[
            styles.filterChip,
            { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line },
            !sort && { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
          ]}
        >
          <Ionicons name="grid-outline" size={14} color={!sort ? activeInk : theme.colors.muted} />
          <Text style={[styles.filterText, { color: !sort ? activeInk : theme.colors.muted }]} numberOfLines={1}>Barchasi</Text>
        </Pressable>
        {sortOptions.map((option) => {
          const active = sort === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => selectSort(option.value)}
              style={[
                styles.filterChip,
                { backgroundColor: theme.colors.elevated, borderColor: theme.colors.line },
                active && { backgroundColor: theme.colors.gold, borderColor: theme.colors.gold },
              ]}
            >
              <Ionicons name={option.icon} size={14} color={active ? activeInk : theme.colors.muted} />
              <Text style={[styles.filterText, { color: active ? activeInk : theme.colors.muted }]} numberOfLines={1}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Search */}
      <View style={[styles.searchWrap, { backgroundColor: theme.colors.input, borderColor: theme.colors.line }]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.muted} style={styles.searchIcon} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Usta yoki xizmatni qidiring..."
          placeholderTextColor={theme.colors.subtle}
          style={[styles.searchInput, { color: theme.colors.text }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={theme.colors.muted} />
          </Pressable>
        )}
      </View>

      {showLocationBadge ? (
        <View style={[styles.locationMsg, { backgroundColor: theme.colors.goldSoft, borderColor: theme.colors.goldDim }]}>
          <Ionicons name={location.coordinates ? "navigate-circle-outline" : "location-outline"} size={17} color={theme.colors.gold} />
          <View style={styles.locationCopy}>
            <Text style={[styles.locationText, { color: theme.colors.gold }]}>{locationText}</Text>
            <Text style={[styles.locationSubtext, { color: theme.colors.muted }]} numberOfLines={2}>{locationDetail}</Text>
          </View>
          {!location.coordinates ? (
            <Pressable onPress={location.refreshLocation} disabled={location.loading} style={[styles.locationAction, { borderColor: theme.colors.goldDim }]}>
              {location.loading ? (
                <ActivityIndicator color={theme.colors.gold} size="small" />
              ) : (
                <Text style={[styles.locationActionText, { color: theme.colors.gold }]} numberOfLines={1}>Yoqish</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading ? <LoadingState label="Barberlar yuklanmoqda..." /> : null}
      {error ? <ErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && filtered.length === 0 ? (
        <EmptyState icon="cut-outline" title="Barber topilmadi" message="Qidiruvni o'zgartiring yoki barcha barberlarni ko'ring." actionLabel="Barchasi" onAction={() => { setSearch(""); setSort(undefined); }} />
      ) : null}

      <View style={styles.list}>
        {filtered.map((barber) => (
          <BarberCard
            key={barber.id}
            barber={barber}
            onSelect={() => navigation.navigate("SelectService", { barberId: barber.id, barber, bookingSource })}
          />
        ))}
      </View>

      {/* Footer links */}
      <View style={styles.footerLinks}>
        <Pressable onPress={() => navigation.navigate("Login", { role: "barber" })} style={styles.footerLink}>
          <Ionicons name="cut-outline" size={14} color={theme.colors.muted} />
          <Text style={[styles.footerLinkText, { color: theme.colors.muted }]}>Barber Login</Text>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.line }]} />
        <Pressable onPress={() => navigation.navigate("Login", { role: "admin" })} style={styles.footerLink}>
          <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.muted} />
          <Text style={[styles.footerLinkText, { color: theme.colors.muted }]}>Admin</Text>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: theme.colors.line }]} />
        <Pressable onPress={() => navigation.navigate("Public", { screen: "FindBooking" })} style={styles.footerLink}>
          <Ionicons name="search-outline" size={14} color={theme.colors.muted} />
          <Text style={[styles.footerLinkText, { color: theme.colors.muted }]}>Bron qidirish</Text>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
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
    fontWeight: "800",
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationSubtext: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "600",
  },
  locationAction: {
    minWidth: 62,
    minHeight: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  locationActionText: {
    fontSize: 12,
    fontWeight: "800",
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
