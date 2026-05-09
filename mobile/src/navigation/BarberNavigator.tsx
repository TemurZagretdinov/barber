import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { BarberStackParamList } from "./types";
import { BarberDashboardScreen } from "../screens/barber/BarberDashboardScreen";
import { BarberScheduleScreen } from "../screens/barber/BarberScheduleScreen";

const Stack = createNativeStackNavigator<BarberStackParamList>();

export function BarberNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="BarberDashboard" component={BarberDashboardScreen} />
      <Stack.Screen name="BarberSchedule" component={BarberScheduleScreen} />
    </Stack.Navigator>
  );
}
