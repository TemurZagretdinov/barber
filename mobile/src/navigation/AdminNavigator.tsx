import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import type { AdminTabParamList } from "./types";
import { adminColors } from "../components/admin/adminTheme";
import { AdminBarbersScreen } from "../screens/admin/AdminBarbersScreen";
import { AdminBookingsScreen } from "../screens/admin/AdminBookingsScreen";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";

const Tab = createBottomTabNavigator<AdminTabParamList>();

export function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: adminColors.black,
        tabBarInactiveTintColor: adminColors.muted,
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600", marginTop: 1 },
        tabBarStyle: {
          height: 72,
          paddingBottom: 14,
          paddingTop: 8,
          borderTopColor: adminColors.line,
          backgroundColor: adminColors.panel,
          elevation: 8,
        },
      }}
    >
      <Tab.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: "Dashboard", tabBarIcon: ({ color }) => <Ionicons name="grid-outline" color={color} size={21} /> }}
      />
      <Tab.Screen
        name="AdminBookings"
        component={AdminBookingsScreen}
        options={{ title: "Bookings", tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" color={color} size={21} /> }}
      />
      <Tab.Screen
        name="AdminBarbers"
        component={AdminBarbersScreen}
        options={{ title: "Barbers", tabBarIcon: ({ color }) => <Ionicons name="cut" color={color} size={21} /> }}
      />
    </Tab.Navigator>
  );
}
