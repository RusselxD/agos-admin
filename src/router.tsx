import { createBrowserRouter, Navigate } from "react-router-dom";
import ErrorBoundary from "./components/common/ErrorBoundary";

import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";
import Dashboard from "./pages/Dashboard";
import Sensor from "./pages/Sensor";
import Settings from "./pages/Settings";
import Responders from "./pages/Responders";
import ProtectedRoute from "./guards/ProtectedRoute";

import Admins from "./pages/Admins";
import Login from "./pages/Login";
import ForcePasswordChange from "./pages/ForcePasswordChange";

import { WeatherProvider } from "./context/WeatherContext";
import { WaterLevelProvider } from "./context/WaterLevelContext";
import { BlockageProvider } from "./context/BlockageContext";
import { FusionAnalysisProvider } from "./context/FusionAnalysisContext";
import { VideoProvider } from "./context/VideoContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { EvacuationProvider } from "./context/EvacuationContext";
import { AdminsPageProvider } from "./pages/Admins/context/AdminsPageContext";
import { CoreProvider } from "./context/CoreContext";
import Weather from "./pages/Weather/Weather";
import ReadingLogs from "./pages/ReadingLogs";
import NotificationLogs from "./pages/NotificationLogs";
import DetectionLogs from "./pages/DetectionLogs";
import Evacuation from "./pages/Evacuation";
import EvacuationCenters from "./pages/EvacuationCenters";
import EvacuationControl from "./pages/EvacuationControl";

export const router = createBrowserRouter([
  {
    path: "auth",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "force-password-change",
        element: <ForcePasswordChange />,
      },
    ],
  },
  {
    path: "/",
    element: (
      // BlockageProvider = for blockage detection AI status
      // WeatherProvider = for weather condition data
      // WaterLevelProvider = for water level sensor data
      //
      // FusionAnalysisProvider = for fusion analysis data
      //
      // WebSocketProvider = for websocket connection
      // LocationAndDevicesProvider = for location ID and device IDs
      <ProtectedRoute>
        <CoreProvider>
          <WebSocketProvider>
            <BlockageProvider>
              <VideoProvider>
                <WeatherProvider>
                  <WaterLevelProvider>
                    <FusionAnalysisProvider>
                      <EvacuationProvider>
                        <MainLayout />
                      </EvacuationProvider>
                    </FusionAnalysisProvider>
                  </WaterLevelProvider>
                </WeatherProvider>
              </VideoProvider>
            </BlockageProvider>
          </WebSocketProvider>
        </CoreProvider>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <ErrorBoundary><Dashboard /></ErrorBoundary>,
      },
      {
        path: "weather",
        element: <ErrorBoundary><Weather /></ErrorBoundary>,
      },
      {
        path: "sensor",
        element: <ErrorBoundary><Sensor /></ErrorBoundary>,
      },
      {
        path: "responders",
        element: <ErrorBoundary><Responders /></ErrorBoundary>,
      },
      {
        path: "reading-logs",
        element: <ErrorBoundary><ReadingLogs /></ErrorBoundary>,
      },
      {
        path: "notification-logs",
        element: <ErrorBoundary><NotificationLogs /></ErrorBoundary>,
      },
      {
        path: "detection-logs",
        element: <ErrorBoundary><DetectionLogs /></ErrorBoundary>,
      },
      {
        path: "evacuation",
        element: <ErrorBoundary><Evacuation /></ErrorBoundary>,
        children: [
          {
            index: true,
            element: <Navigate to="control" replace />,
          },
          {
            path: "control",
            element: <EvacuationControl />,
          },
          {
            path: "centers",
            element: <EvacuationCenters />,
          },
        ],
      },
      {
        path: "evacuation-centers",
        element: <Navigate to="/evacuation/centers" replace />,
      },
      {
        path: "evacuation-control",
        element: <Navigate to="/evacuation/control" replace />,
      },
      {
        path: "admins",
        element: (
          <ErrorBoundary>
            <AdminsPageProvider>
              <Admins />
            </AdminsPageProvider>
          </ErrorBoundary>
        ),
      },
      {
        path: "settings",
        element: <ErrorBoundary><Settings /></ErrorBoundary>,
      },
    ],
  },
]);
