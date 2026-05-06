import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { AdminNavigator } from "./AdminNavigator";
import { BarberNavigator } from "./BarberNavigator";
import { PublicNavigator } from "./PublicNavigator";
import type { RootStackParamList } from "./types";
import { colors } from "../components/ScreenContainer";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RoleSelectScreen } from "../screens/auth/RoleSelectScreen";
import { useAuth } from "../store/authStore";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas }}>
        <ActivityIndicator color={colors.black} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Public">
      <Stack.Screen name="Public" component={PublicNavigator} />
      <Stack.Screen name="RoleSelect" component={RoleSelectScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Admin" component={AdminNavigator} />
      <Stack.Screen name="Barber" component={BarberNavigator} />
    </Stack.Navigator>
  );
}
