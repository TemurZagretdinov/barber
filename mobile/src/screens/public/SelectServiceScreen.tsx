import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { getPublicBarberServices } from "../../api/barbers";
import { BarberCard } from "../../components/BarberCard";
import { PrimaryButton } from "../../components/PrimaryButton";
import { colors, ScreenContainer } from "../../components/ScreenContainer";
import type { PublicStackParamList } from "../../navigation/types";
import type { BarberService } from "../../types/barber";

type Props = NativeStackScreenProps<PublicStackParamList, "SelectService">;

export function SelectServiceScreen({ navigation, route }: Props) {
  const { barber, barberId } = route.params;
  const [services, setServices] = useState<BarberService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setServices(await getPublicBarberServices(barberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load services");
    } finally {
      setLoading(false);
    }
  }, [barberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Xizmat tanlash</Text>
          <Text style={styles.subtitle}>Narx va davomiylik</Text>
        </View>
      </View>

      {/* Barber compact card */}
      <BarberCard barber={barber} compact />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Section label */}
      <Text style={styles.sectionLabel}>Mavjud xizmatlar</Text>

      {loading ? <ActivityIndicator style={{ marginTop: 24 }} color={colors.gold} /> : null}
      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle-outline" size={14} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.list}>
        {services.map((service) => (
          <Pressable
            key={service.id}
            style={styles.serviceCard}
            onPress={() => navigation.navigate("SelectTime", { barberId, barber, service })}
          >
            <View style={styles.icon}>
              <Ionicons name="cut-outline" size={20} color="#0A0A0A" />
            </View>
            <View style={styles.serviceBody}>
              <Text style={styles.serviceName}>{service.name}</Text>
              {service.description ? (
                <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
              ) : null}
              <Text style={styles.serviceMeta}>
                {Math.round(service.price).toLocaleString("uz-UZ")} so'm · {service.duration_minutes} min
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      {!loading && services.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="cut-outline" size={36} color={colors.muted} />
          <Text style={styles.emptyText}>Xizmatlar mavjud emas</Text>
          <PrimaryButton title="Ortga" onPress={() => navigation.goBack()} variant="ghost" style={{ marginTop: 8 }} />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.soft,
    borderWidth: 1,
    borderColor: colors.line,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 14,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  list: {
    gap: 10,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  serviceBody: {
    flex: 1,
  },
  serviceName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  serviceDesc: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  serviceMeta: {
    color: colors.gold,
    fontWeight: "700",
    fontSize: 13,
    marginTop: 6,
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
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 10,
  },
  emptyText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 15,
  },
});
