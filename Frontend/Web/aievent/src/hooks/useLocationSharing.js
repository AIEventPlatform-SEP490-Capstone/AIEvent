import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import Cookies from "js-cookie";
import { getUserFromJWT } from "../lib/jwtUtils";

/**
 * Hook để quản lý chia sẻ vị trí và cập nhật vị trí realtime qua SignalR
 * @param {Function} onLocationUpdate - Callback khi nhận được cập nhật vị trí từ server
 * @param {boolean} isLocationSharingEnabled - Trạng thái bật/tắt chia sẻ vị trí
 */
export const useLocationSharing = (onLocationUpdate, isLocationSharingEnabled = false) => {
  const connectionRef = useRef(null);
  const locationUpdateIntervalRef = useRef(null);
  const onLocationUpdateRef = useRef(onLocationUpdate);

  // Cập nhật ref khi callback thay đổi
  useEffect(() => {
    onLocationUpdateRef.current = onLocationUpdate;
  }, [onLocationUpdate]);

  // Hàm để lấy userId từ token
  const getUserId = useCallback(() => {
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) {
      return null;
    }
    const userData = getUserFromJWT(accessToken);
    // nameid là userId trong JWT
    return userData?.nameid || null;
  }, []);

  // Hàm để gọi UpdateLocation trên SignalR hub
  // Backend yêu cầu: UpdateLocation(Guid userId, double lat, double lng)
  const updateLocation = useCallback(async (latitude, longitude) => {
    if (!connectionRef.current) {
      console.warn("SignalR connection not initialized");
      return;
    }

    // Đợi connection ready nếu chưa connected
    if (connectionRef.current.state === signalR.HubConnectionState.Disconnected) {
      try {
        await connectionRef.current.start();
      } catch (err) {
        console.error("Failed to start SignalR connection:", err);
        return;
      }
    }

    // Kiểm tra lại state sau khi start
    if (connectionRef.current.state !== signalR.HubConnectionState.Connected) {
      console.warn("SignalR connection not ready for location update. State:", connectionRef.current.state);
      return;
    }

    // Lấy userId từ token
    const userId = getUserId();
    if (!userId) {
      console.error("Cannot get userId from token");
      return;
    }

    try {
      // Backend yêu cầu userId làm tham số đầu tiên
      await connectionRef.current.invoke("UpdateLocation", userId, latitude, longitude);
      console.log("Location updated via SignalR:", { userId, latitude, longitude });
    } catch (error) {
      console.error("Error updating location via SignalR:", error);
    }
  }, [getUserId]);

  // Setup SignalR connection - chỉ connect khi location sharing được bật
  useEffect(() => {
    // Chỉ connect khi location sharing được bật
    if (!isLocationSharingEnabled) {
      // Nếu đã có connection và location sharing bị tắt, disconnect
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {});
        connectionRef.current = null;
      }
      return;
    }

    // Lấy token từ cookies - token đã được quản lý bởi fetcher.js
    // Nhưng SignalR vẫn cần token để authenticate
    const accessToken = Cookies.get("accessToken");

    if (!accessToken) {
      console.warn("No access token found for SignalR location connection");
      return;
    }

    // Nếu đã có connection rồi thì không tạo lại
    if (connectionRef.current) {
      return;
    }

    // Determine the base URL based on environment
    const isVercel = window.location.hostname.includes('vercel.app');
    const baseUrl = isVercel ? 'https://aievent.duckdns.org' : '';

    // Tạo connection mới - Hub name là "location" (từ LocationHub class)
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
      .configureLogging(signalR.LogLevel.Information) // Tăng log level để debug
      .build();

    // Lưu vào ref
    connectionRef.current = connection;

    // Đăng ký nhận cập nhật vị trí từ bạn bè (nếu có)
    // Sử dụng ref để tránh stale closure
    connection.on("LocationUpdated", (data) => {
      if (onLocationUpdateRef.current && typeof onLocationUpdateRef.current === 'function') {
        onLocationUpdateRef.current(data);
      }
    });

    // Event handlers để debug
    connection.onclose((error) => {
      if (error) {
        console.error("SignalR Location connection closed with error:", error);
      } else {
        console.log("SignalR Location connection closed");
      }
    });

    connection.onreconnecting((error) => {
      console.log("SignalR Location reconnecting...", error);
    });

    connection.onreconnected((connectionId) => {
      console.log("SignalR Location reconnected. Connection ID:", connectionId);
    });

    // Bắt đầu kết nối
    const startConnection = async () => {
      try {
        await connection.start();
        console.log("SignalR Location Hub Connected successfully. Connection ID:", connection.connectionId);
      } catch (err) {
        // Không bỏ qua lỗi, log chi tiết để debug
        console.error("SignalR Location Connection Failed:", {
          message: err.message,
          stack: err.stack,
          name: err.name
        });
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
  }, [isLocationSharingEnabled]); // Chỉ chạy khi isLocationSharingEnabled thay đổi

  // Tự động cập nhật vị trí định kỳ nếu đã bật chia sẻ
  useEffect(() => {
    if (!isLocationSharingEnabled) {
      if (locationUpdateIntervalRef.current) {
        clearInterval(locationUpdateIntervalRef.current);
        locationUpdateIntervalRef.current = null;
      }
      return;
    }

    // Đợi connection ready trước khi bắt đầu update
    const waitForConnection = async () => {
      if (!connectionRef.current) {
        console.warn("Connection not initialized, waiting...");
        return;
      }

      // Nếu chưa connected, đợi một chút rồi thử lại
      if (connectionRef.current.state !== signalR.HubConnectionState.Connected) {
        console.log("Waiting for SignalR connection... Current state:", connectionRef.current.state);
        // Đợi tối đa 5 giây
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts && connectionRef.current.state !== signalR.HubConnectionState.Connected) {
          await new Promise(resolve => setTimeout(resolve, 500));
          attempts++;
        }
        
        if (connectionRef.current.state !== signalR.HubConnectionState.Connected) {
          console.warn("SignalR connection not ready after waiting");
          return;
        }
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
    };

    waitForConnection();

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

