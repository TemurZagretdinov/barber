import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { AdminNavigator } from "./AdminNavigator";
import { BarberNavigator } from "./BarberNavigator";
import { PublicNavigator } from "./PublicNavigator";
import type { RootStackParamList } from "./types";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RoleSelectScreen } from "../screens/auth/RoleSelectScreen";
import { useAuth } from "../store/authStore";
import { useTheme } from "../theme/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { loading } = useAuth();
  const { theme } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.colors.canvas }}>
        <ActivityIndicator color={theme.colors.gold} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "fade_from_bottom" }} initialRouteName="Public">
      <Stack.Screen name="Public" component={PublicNavigator} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="Barber" component={BarberNavigator} />
    </Stack.Navigator>
  );
}
