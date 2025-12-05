import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { showError } from "../lib/toastUtils";

/**
 * Hook để quản lý chia sẻ vị trí và cập nhật vị trí realtime qua SignalR
 * @param {Function} onLocationUpdate - Callback khi nhận được cập nhật vị trí từ server
 * @param {boolean} isLocationSharingEnabled - Trạng thái bật/tắt chia sẻ vị trí
 */
export const useLocationSharing = (onLocationUpdate, isLocationSharingEnabled = false) => {
  const connectionRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);

  // Hàm để gọi UpdateLocation trên SignalR hub
  const updateLocation = useCallback(async (latitude, longitude) => {
    if (!connectionRef.current || connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      console.warn("SignalR connection not ready for location update");
      return;
    }

    try {
      await connectionRef.current.invoke("UpdateLocation", latitude, longitude);
      console.log("Location updated via SignalR:", { latitude, longitude });
    } catch (error) {
      console.error("Error updating location via SignalR:", error);
    }
  }, []);

  // Setup SignalR connection
  useEffect(() => {
    // Lấy token
    const accessToken = localStorage.getItem("accessToken") || 
      document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");

    if (!accessToken) {
      return;
    }

    // Nếu đã có connection rồi thì không tạo lại
    if (connectionRef.current) {
      return;
    }

    // Determine the base URL based on environment
    const isVercel = window.location.hostname.includes('vercel.app');
    const baseUrl = isVercel ? 'https://aievent.duckdns.org' : '';

    // Tạo connection mới - cần xác định hub name cho location
    // Giả sử hub name là "location" hoặc "locationHub"
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${baseUrl}/hubs/location`, {
        accessTokenFactory: () => accessToken,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.elapsedMilliseconds > 120000) return null; // Dừng sau 2 phút
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount + 1), 30000);
        }
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    // Lưu vào ref
    connectionRef.current = connection;

    // Đăng ký nhận cập nhật vị trí từ bạn bè (nếu có)
    connection.on("LocationUpdated", (data) => {
      if (onLocationUpdate && typeof onLocationUpdate === 'function') {
        onLocationUpdate(data);
      }
    });

    // Bắt đầu kết nối
    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR Location Hub Connected successfully");
      } catch (err) {
        if (err?.message?.includes?.("negotiation") || err?.message?.includes?.("stop")) {
          console.warn("SignalR location connection interrupted during startup (normal on re-mount)");
          return;
        }
        if (err?.message?.includes?.("Failed to start the connection")) {
          console.warn("SignalR location connection interrupted during startup (normal on re-mount)");
          return;
        }
        console.error("SignalR Location Connection Failed:", err);
        // Không hiển thị lỗi cho user vì có thể hub chưa được setup
      }
    };

    startConnection();

    // Cleanup khi component unmount
    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      if (connectionRef.current) {
        console.log("SignalR Location: Cleaning up connection...");
        connectionRef.current.off("LocationUpdated");
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
    };
  }, [onLocationUpdate]);

  // Tự động cập nhật vị trí định kỳ nếu đã bật chia sẻ
  useEffect(() => {
    if (!isLocationSharingEnabled || !connectionRef.current) {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      return;
    }

    // Lấy vị trí hiện tại và cập nhật
    const updateCurrentLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            updateLocation(latitude, longitude);
          },
          (error) => {
            console.error("Error getting location for update:", error);
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 10000 // Cache 10 seconds
          }
        );
      }
    };

    // Cập nhật ngay lập tức
    updateCurrentLocation();

    // Cập nhật định kỳ mỗi 30 giây
    locationUpdateIntervalRef.current = setInterval(updateCurrentLocation, 30000);

    return () => {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
    };
  }, [isLocationSharingEnabled, updateLocation]);

  return {
    updateLocation,
    isConnected: connectionRef.current?.state === signalR.HubConnectionState.Connected
  };
};

