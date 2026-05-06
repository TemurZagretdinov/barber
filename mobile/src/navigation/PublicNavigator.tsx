import { createNativeStackNavigator } from "@react-navigation/native-stack";

import type { PublicStackParamList } from "./types";
import { BookingDetailsScreen } from "../screens/public/BookingDetailsScreen";
import { BookingSuccessScreen } from "../screens/public/BookingSuccessScreen";
import { ChooseBarberScreen } from "../screens/public/ChooseBarberScreen";
import { CustomerCabinetScreen } from "../screens/public/CustomerCabinetScreen";
import { FindBookingScreen } from "../screens/public/FindBookingScreen";
import { SelectServiceScreen } from "../screens/public/SelectServiceScreen";
import { SelectTimeScreen } from "../screens/public/SelectTimeScreen";

const Stack = createNativeStackNavigator<PublicStackParamList>();

export function PublicNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChooseBarber" component={ChooseBarberScreen} />
      <Stack.Screen name="SelectService" component={SelectServiceScreen} />
      <Stack.Screen name="SelectTime" component={SelectTimeScreen} />
      <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
      <Stack.Screen name="BookingSuccess" component={BookingSuccessScreen} />
      <Stack.Screen name="FindBooking" component={FindBookingScreen} />
      <Stack.Screen name="CustomerCabinet" component={CustomerCabinetScreen} />
    </Stack.Navigator>
  );
}
