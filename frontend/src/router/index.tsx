import { useSyncExternalStore } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

import App from "../App";
import { authStore } from "../store/authStore";
import type { Role } from "../types/auth";
import { AdminLayout } from "../pages/admin/AdminLayout";
import { AdminLoginPage } from "../pages/admin/AdminLoginPage";
import { BarbersPage } from "../pages/admin/BarbersPage";
import { BookingsPage } from "../pages/admin/BookingsPage";
import { DashboardPage } from "../pages/admin/DashboardPage";
import { BarberDashboardPage } from "../pages/barber/BarberDashboardPage";
import { BarberLoginPage } from "../pages/barber/BarberLoginPage";
import { BarberSchedulePage } from "../pages/barber/BarberSchedulePage";
import { BarberWorkSchedulePage } from "../pages/barber/BarberWorkSchedulePage";
import { CustomerCabinetPage } from "../pages/customer/CustomerCabinetPage";
import { CustomerLoginPage } from "../pages/customer/CustomerLoginPage";
import { CustomerRegisterPage } from "../pages/customer/CustomerRegisterPage";
import { BookingDetailsPage } from "../pages/public/BookingDetailsPage";
import { BookingSuccessPage } from "../pages/public/BookingSuccessPage";
import { SelectBarberPage } from "../pages/public/SelectBarberPage";
import { SelectServicePage } from "../pages/public/SelectServicePage";
import { SelectTimePage } from "../pages/public/SelectTimePage";

function ProtectedRoute({ role, fallback }: { role: Role; fallback: string }) {
  const state = useSyncExternalStore(authStore.subscribe, authStore.getState);
  if (!state.token || state.user?.role !== role) {
    return <Navigate replace to={fallback} />;
  }
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <SelectBarberPage /> },
      { path: "book", element: <SelectBarberPage /> },
      { path: "book/service", element: <SelectServicePage /> },
      { path: "book/time", element: <SelectTimePage /> },
      { path: "book/details", element: <BookingDetailsPage /> },
      { path: "book/success", element: <BookingSuccessPage /> },
      { path: "customer/login", element: <CustomerLoginPage /> },
      { path: "customer/register", element: <CustomerRegisterPage /> },
      {
        element: <ProtectedRoute role="customer" fallback="/customer/login" />,
        children: [
          { path: "customer", element: <CustomerCabinetPage /> },
        ],
      },
      { path: "admin/login", element: <AdminLoginPage /> },
      {
        element: <ProtectedRoute role="admin" fallback="/admin/login" />,
        children: [
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "barbers", element: <BarbersPage /> },
              { path: "bookings", element: <BookingsPage /> },
            ],
          },
        ],
      },
      { path: "barber/login", element: <BarberLoginPage /> },
      {
        element: <ProtectedRoute role="barber" fallback="/barber/login" />,
        children: [
          { path: "barber/dashboard", element: <BarberDashboardPage /> },
          { path: "barber/schedule", element: <BarberSchedulePage /> },
          { path: "barber/work-schedule", element: <BarberWorkSchedulePage /> },
        ],
      },
      { path: "*", element: <Navigate replace to="/book" /> },
    ],
  },
]);
