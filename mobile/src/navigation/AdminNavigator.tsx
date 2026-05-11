import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { AdminTabParamList } from "./types";
import { AdminBarbersScreen } from "../screens/admin/AdminBarbersScreen";
import { AdminBookingsScreen } from "../screens/admin/AdminBookingsScreen";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { useTheme } from "../theme/theme";

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminNavigator() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const bottom = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.gold,
        tabBarInactiveTintColor: theme.colors.muted,
        tabBarItemStyle: { paddingTop: 4 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginTop: 1 },
        tabBarStyle: {
          minHeight: 58 + bottom,
          paddingBottom: bottom,
          paddingTop: 8,
          borderTopColor: theme.colors.goldDim,
          backgroundColor: theme.colors.tabBar,
          shadowColor: theme.colors.gold,
          shadowOpacity: theme.mode === "light" ? 0.12 : 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -6 },
          elevation: 10,
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: "Panel", tabBarIcon: ({ color }) => <Ionicons name="grid-outline" color={color} size={21} /> }}
      />
      <Tab.Screen
        name="AdminBookings"
        component={AdminBookingsScreen}
        options={{ title: "Bronlar", tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" color={color} size={21} /> }}
      />
      <Tab.Screen
        name="AdminBarbers"
        component={AdminBarbersScreen}
        options={{ title: "Barberlar", tabBarIcon: ({ color }) => <Ionicons name="cut" color={color} size={21} /> }}
      />
    </Tab.Navigator>
  );
}
