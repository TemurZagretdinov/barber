import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { ComponentProps, ReactNode } from "react";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { createAdminBarber, getAdminBarbers } from "../../api/barbers";
import { barberImage, barberName, barberRating, barberSpecialty } from "../../components/BarberCard";
import { AdminPageHeader, AdminPanel } from "../../components/admin/AdminPanel";
import { adminColors, adminRadius, adminSpacing, adminTypography } from "../../components/admin/adminTheme";
import { MoneyText } from "../../components/MoneyText";
import { PrimaryButton } from "../../components/PrimaryButton";
import { ResponsiveText } from "../../components/ResponsiveText";
import { ScreenContainer } from "../../components/ScreenContainer";
import { useTheme } from "../../theme/theme";
import type { Barber } from "../../types/barber";

export function AdminBarbersScreen() {
  const { theme } = useTheme();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    specialty: "",
    barbershop_name: "",
    address: "",
    latitude: "",
    longitude: "",
    work_start_time: "09:00",
    work_end_time: "18:00",
    off_days: ["sunday"],
    base_price: "45000",
    photo_url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=300&q=80",
    phone: "",
    years_experience: "1",
    is_active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setBarbers(await getAdminBarbers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load barbers");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function saveBarber() {
    const price = Number(form.base_price);
    const latitude = form.latitude ? Number(form.latitude) : null;
    const longitude = form.longitude ? Number(form.longitude) : null;
    if (!form.full_name.trim() || !form.email.trim() || !Number.isFinite(price)) {
      setError("Full name, email va narx to'g'ri kiritilishi kerak.");
      return;
    }
    if (form.work_start_time >= form.work_end_time) {
      setError("Ish boshlanish vaqti tugash vaqtidan oldin bo'lishi kerak.");
      return;
    }
    await createAdminBarber({
      full_name: form.full_name,
      email: form.email,
      password: form.password || "123456",
      specialty: form.specialty,
      barbershop_name: form.barbershop_name || null,
      address: form.address || null,
      latitude,
      longitude,
      work_start_time: form.work_start_time,
      work_end_time: form.work_end_time,
      off_days: form.off_days,
      price_from: price,
      base_price: price,
      photo_url: form.photo_url,
      phone: form.phone || null,
      rating: 4.8,
      years_experience: Number(form.years_experience) || 0,
      bio: null,
      is_active: form.is_active,
    });
    setModalOpen(false);
    await load();
  }

  return (
    <ScreenContainer>
      <AdminPageHeader
        title="Barbers"
        subtitle={`${barbers.length} barbers on the team`}
        action={
          <PrimaryButton
            title="Add"
            onPress={() => setModalOpen(true)}
            icon={<Ionicons name="add" color={theme.colors.onGold} size={18} />}
            style={styles.addButton}
          />
        }
      />
      {loading ? <ActivityIndicator style={styles.state} color={theme.colors.gold} /> : null}
      {error ? <Text style={[styles.error, { color: theme.colors.danger }]}>{error}</Text> : null}
      {!loading && barbers.length === 0 ? <Text style={[styles.empty, { color: theme.colors.muted }]}>No barbers found.</Text> : null}

      <View style={styles.list}>
        {barbers.map((barber) => (
          <AdminPanel key={barber.id} style={styles.barberCard}>
            <Image source={{ uri: barberImage(barber) }} style={[styles.avatar, { backgroundColor: theme.colors.elevated }]} />
            <View style={styles.info}>
              <View style={styles.nameRow}>
                <ResponsiveText variant="section" color="text" numberOfLines={2} style={styles.barberName}>
                  {barberName(barber)}
                </ResponsiveText>
                <View style={styles.rating}>
                  <Ionicons name="star" color="#f59e0b" size={14} />
                  <Text style={[styles.ratingText, { color: theme.colors.muted }]}>{barberRating(barber).toFixed(1)}</Text>
                </View>
              </View>
              <Text style={[styles.specialty, { color: theme.colors.muted }]} numberOfLines={1}>{barberSpecialty(barber)}</Text>
              <Text style={[styles.meta, { color: theme.colors.subtle }]} numberOfLines={2}>
                {barber.years_experience ?? 0} yrs exp - {barber.email} - {barber.total_bookings ?? 0} total bookings
              </Text>
              <View style={styles.financeContainer}>
                <Text style={[styles.financeMeta, { color: (barber.debt ?? barber.demo_debt ?? 0) > 0 ? theme.colors.danger : theme.colors.gold }]} numberOfLines={1}>
                  Balans: <MoneyText amount={barber.balance ?? barber.demo_balance ?? 0} color="gold" compact /> - Qarz: <MoneyText amount={barber.debt ?? barber.demo_debt ?? 0} color="danger" compact />
                </Text>
              </View>
            </View>
            <View style={[styles.todayBox, { backgroundColor: theme.colors.goldSoft }]}>
              <Text style={[styles.todayValue, { color: theme.colors.gold }]}>{barber.today_bookings ?? 0}</Text>
              <Text style={[styles.todayLabel, { color: theme.colors.muted }]}>today</Text>
            </View>
          </AdminPanel>
        ))}
      </View>
      <Modal visible={modalOpen} animationType="slide" onRequestClose={() => setModalOpen(false)}>
        <ScreenContainer>
          <AdminPageHeader title="Add Barber" subtitle="Yangi barber profili" />
          <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
            <FormSection title="Shaxsiy ma'lumotlar">
              <Field label="Full name" value={form.full_name} onChangeText={(value) => setForm({ ...form, full_name: value })} />
              <Field label="Email / login" value={form.email} onChangeText={(value) => setForm({ ...form, email: value })} />
              <Field label="Password" value={form.password} onChangeText={(value) => setForm({ ...form, password: value })} placeholder="Auto: 123456" secureTextEntry />
              <Field label="Telefon" value={form.phone} onChangeText={(value) => setForm({ ...form, phone: value })} />
              <Field label="Specialty" value={form.specialty} onChangeText={(value) => setForm({ ...form, specialty: value })} />
            </FormSection>
            <FormSection title="Barbershop lokatsiyasi">
              <Field label="Barbershop nomi" value={form.barbershop_name} onChangeText={(value) => setForm({ ...form, barbershop_name: value })} />
              <Field label="Manzil" value={form.address} onChangeText={(value) => setForm({ ...form, address: value })} />
              <View style={styles.formRow}>
                <Field label="Latitude" value={form.latitude} onChangeText={(value) => setForm({ ...form, latitude: value })} style={styles.flexField} />
                <Field label="Longitude" value={form.longitude} onChangeText={(value) => setForm({ ...form, longitude: value })} style={styles.flexField} />
              </View>
            </FormSection>
            <FormSection title="Ish vaqti va narx">
              <View style={styles.formRow}>
                <Field label="Start" value={form.work_start_time} onChangeText={(value) => setForm({ ...form, work_start_time: value })} style={styles.flexField} />
                <Field label="End" value={form.work_end_time} onChangeText={(value) => setForm({ ...form, work_end_time: value })} style={styles.flexField} />
              </View>
              <Field label="Xizmat narxi" value={form.base_price} onChangeText={(value) => setForm({ ...form, base_price: value })} />
              <Field label="Tajriba yili" value={form.years_experience} onChangeText={(value) => setForm({ ...form, years_experience: value })} />
              <View style={styles.switchRow}>
                <Text style={[styles.formLabel, { color: theme.colors.muted }]}>Active</Text>
                <Switch value={form.is_active} onValueChange={(value) => setForm({ ...form, is_active: value })} />
              </View>
            </FormSection>
            <FormSection title="Rasm va qo'shimcha">
              <Field label="Photo URL" value={form.photo_url} onChangeText={(value) => setForm({ ...form, photo_url: value })} />
            </FormSection>
            <View style={styles.modalActions}>
              <PrimaryButton title="Cancel" onPress={() => setModalOpen(false)} variant="ghost" style={styles.modalButton} />
              <PrimaryButton title="Create" onPress={saveBarber} style={styles.modalButton} />
            </View>
          </ScrollView>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <AdminPanel style={styles.formSection}>
      <Text style={[styles.formTitle, { color: theme.colors.text }]}>{title}</Text>
      {children}
    </AdminPanel>
  );
}

function Field({ label, style, ...props }: ComponentProps<typeof TextInput> & { label: string; style?: object }) {
  const { theme } = useTheme();
  return (
    <View style={style}>
      <Text style={[styles.formLabel, { color: theme.colors.muted }]}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={theme.colors.subtle}
        style={[styles.input, { backgroundColor: theme.colors.input, borderColor: theme.colors.line, color: theme.colors.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    minHeight: 44,
    borderRadius: adminRadius.md,
    paddingHorizontal: adminSpacing.md,
  },
  state: {
    marginTop: adminSpacing.lg,
  },
  error: {
    color: adminColors.danger,
    marginTop: adminSpacing.md,
    fontWeight: "500",
  },
  empty: {
    ...adminTypography.body,
    color: adminColors.muted,
    marginTop: adminSpacing.lg,
    textAlign: "center",
  },
  list: {
    gap: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  formContent: {
    gap: adminSpacing.md,
    paddingBottom: 42,
  },
  formSection: {
    gap: 12,
  },
  formTitle: {
    ...adminTypography.cardTitle,
    fontWeight: "700",
  },
  formLabel: {
    ...adminTypography.label,
    color: adminColors.muted,
    marginBottom: 6,
  },
  input: {
    minHeight: 52,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    backgroundColor: "#1C1C1C",
    paddingHorizontal: 14,
    color: "#FFFFFF",
  },
  formRow: {
    flexDirection: "row",
    gap: adminSpacing.sm,
  },
  flexField: {
    flex: 1,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: adminSpacing.sm,
    paddingBottom: 20,
  },
  modalButton: {
    flex: 1,
  },
  barberCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: adminSpacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.soft,
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: adminSpacing.sm,
  },
  barberName: {
    fontSize: 16,
    fontWeight: "800",
    flexShrink: 1,
  },
  rating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    ...adminTypography.label,
    color: adminColors.muted,
  },
  specialty: {
    ...adminTypography.body,
    color: "#53627b",
    marginTop: 2,
  },
  meta: {
    ...adminTypography.label,
    marginTop: 6,
  },
  financeContainer: {
    marginTop: 5,
  },
  financeMeta: {
    ...adminTypography.label,
    fontWeight: "800",
  },
  todayBox: {
    minWidth: 54,
    alignItems: "center",
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.soft,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.sm,
  },
  todayValue: {
    fontSize: 24,
    lineHeight: 29,
    fontWeight: "700",
    color: adminColors.text,
  },
  todayLabel: {
    ...adminTypography.label,
  },
});
