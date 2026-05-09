import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { PrimaryButton } from "./PrimaryButton";
import { useTheme } from "../theme/theme";
import type { Barber } from "../types/barber";

const fallbackImage = "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80";

export function barberName(barber: Barber): string {
  return barber.full_name || (barber as Barber & { name?: string }).name || "Barber";
}

export function barberSpecialty(barber: Barber): string {
  return barber.specialty || "Professional Barber";
}

export function barberRating(barber: Barber): number {
  return barber.average_rating ?? barber.rating ?? 0;
}

export function barberImage(barber: Barber): string {
  return barber.avatar || barber.photo_url || fallbackImage;
}

function barberPrice(barber: Barber): string | null {
  return typeof barber.price_from === "number" ? `${barber.price_from.toLocaleString()} so'm` : null;
}

function barberDistance(barber: Barber): string | null {
  if (typeof barber.distance_km !== "number") {
    return null;
  }

  return `${barber.distance_km.toFixed(barber.distance_km < 10 ? 1 : 0)} km uzoqlikda`;
}

export function BarberCard({
  barber,
  onSelect,
  compact = false,
}: {
  barber: Barber;
  onSelect?: () => void;
  compact?: boolean;
}) {
  const { theme } = useTheme();
  const detail =
    typeof barber.years_experience === "number"
      ? `${barber.years_experience} yrs exp`
      : typeof barber.completed_bookings_count === "number"
        ? `${barber.completed_bookings_count} completed`
        : barber.services?.length
          ? `${barber.services.length} services`
          : "Available";

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.line,
          shadowColor: theme.colors.gold,
          shadowOpacity: theme.mode === "light" ? 0.1 : 0.04,
        },
        compact && styles.compactCard,
      ]}
      onPress={onSelect}
      disabled={!onSelect}
    >
      <View style={[styles.avatarWrap, { borderColor: theme.colors.goldDim }, compact && styles.compactAvatarWrap]}>
        <Image source={{ uri: barberImage(barber) }} style={[styles.avatar, { backgroundColor: theme.colors.elevated }, compact && styles.compactAvatar]} />
      </View>
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.text }, compact && styles.compactName]} numberOfLines={1} ellipsizeMode="tail">
            {barberName(barber)}
          </Text>
          {!compact && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={theme.colors.gold} />
            </View>
          )}
        </View>
        <Text style={[styles.specialty, { color: theme.colors.muted }]} numberOfLines={compact ? 1 : 2} ellipsizeMode="tail">
          {barberSpecialty(barber)}
        </Text>
        {!compact ? (
          <View style={styles.metaRow}>
            <View style={styles.rating}>
              <Ionicons name="star" size={13} color={theme.colors.gold} />
              <Text style={[styles.ratingText, { color: theme.colors.gold }]}>{barberRating(barber).toFixed(1)}</Text>
            </View>
            <Text style={[styles.priceBadge, { color: theme.colors.gold }]} numberOfLines={1}>
              {barberDistance(barber) ?? barberPrice(barber) ?? detail}
            </Text>
          </View>
        ) : null}
      </View>
      {onSelect && !compact ? (
        <PrimaryButton title="Book" onPress={onSelect} style={styles.selectButton} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  compactCard: {
    shadowOpacity: 0,
    padding: 10,
  },
  avatarWrap: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 2,
  },
  compactAvatarWrap: {
    borderRadius: 14,
    padding: 1.5,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 15,
  },
  compactAvatar: {
    width: 46,
    height: 46,
    borderRadius: 11,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  verifiedBadge: {
    marginTop: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  compactName: {
    fontSize: 15,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexShrink: 0,
  },
  ratingText: {
    fontWeight: "700",
    fontSize: 12,
  },
  specialty: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
    lineHeight: 18,
  },
  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceBadge: {
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  selectButton: {
    width: 80,
    minHeight: 40,
    borderRadius: 12,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
});
