import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BarberStackParamList } from "./types";
import { BarberDashboardScreen } from "../screens/barber/BarberDashboardScreen";
import { BarberScheduleScreen } from "../screens/barber/BarberScheduleScreen";
import { useTheme } from "../theme/theme";

const Tab = createBottomTabNavigator<BarberStackParamList>();

export function BarberNavigator() {
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
        tabBarLabelStyle: { fontSize: 12, fontWeight: "800", marginTop: 1 },
        tabBarItemStyle: { paddingTop: 4 },
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
        name="BarberDashboard"
        component={BarberDashboardScreen}
        options={{
          title: "Hisob",
          tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" color={color} size={21} />,
        }}
      />
      <Tab.Screen
        name="BarberSchedule"
        component={BarberScheduleScreen}
        options={{
          title: "Mijozlar",
          tabBarIcon: ({ color }) => <Ionicons name="people-outline" color={color} size={21} />,
        }}
      />
    </Tab.Navigator>
  );
}
