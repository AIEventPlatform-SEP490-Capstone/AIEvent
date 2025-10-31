import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authAPI } from "../../api/fetcher";
import Cookies from "js-cookie";
import { getUserFromJWT, isJWTExpired } from "../../lib/jwtUtils";
import {
  getCookieOptions,
  clearRememberedEmail,
} from "../../lib/rememberMeUtils";

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { data } = response;

      // Get cookie options based on rememberMe preference
      const cookieOptions = getCookieOptions(
        credentials.rememberMe,
        data.expiresAt
      );
      //lưu accessToken vào cookies
      Cookies.set("accessToken", data.accessToken, cookieOptions);
      // Decode JWT token để lấy thông tin user
      const userData = getUserFromJWT(data.accessToken);
      // Lưu user data vào localStorage
      localStorage.setItem("currentUser", JSON.stringify(userData));

      return {
        user: userData,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        },
      };
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

// register thunk: backend DOES NOT return token here (OTP flow)
export const register = createAsyncThunk(
  "auth/register",
  async (registerData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(registerData);
      const { data } = response;

      // If backend returns token (rare), treat as auto-login (fallback)
      if (data?.accessToken) {
        const cookieOptions = getCookieOptions(false, data.expiresAt);
        Cookies.set("accessToken", data.accessToken, cookieOptions);
        const userData = getUserFromJWT(data.accessToken);
        localStorage.setItem("currentUser", JSON.stringify(userData));

        return {
          user: userData,
          tokens: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          },
          raw: data,
        };
      }

      // Normal OTP flow: no token, return raw data
      return {
        raw: data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

// verifyOtp thunk: backend returns accessToken on success
export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otpCode }, { rejectWithValue }) => {
    try {
      const response = await authAPI.verifyOtp({ email, otpCode });
      const { data } = response;

      if (!data?.accessToken) {
        return rejectWithValue({
          message: data?.message || "Verify OTP failed - no token returned",
        });
      }

      Cookies.set("accessToken", data.accessToken, {
        expires: new Date(data.expiresAt),
        secure: true,
        sameSite: "strict",
      });

      const userData = getUserFromJWT(data.accessToken);
      // Lưu user data vào localStorage
      localStorage.setItem("currentUser", JSON.stringify(userData));

      return {
        user: userData,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        },
        raw: data,
      };
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : { message: error.message }
      );
    }
  }
);

export const googleLogin = createAsyncThunk(
  "auth/googleLogin",
  async (idToken, { rejectWithValue }) => {
    try {
      const response = await authAPI.googleLogin(idToken);
      const { data } = response;

      // Get cookie options (default to 30 days for Google login)
      const cookieOptions = getCookieOptions(true, data.expiresAt);
      //lưu accessToken vào cookies
      Cookies.set("accessToken", data.accessToken, cookieOptions);
      // Decode JWT token để lấy thông tin user
      const userData = getUserFromJWT(data.accessToken);
      // Lưu user data vào localStorage
      localStorage.setItem("currentUser", JSON.stringify(userData));

      return {
        user: userData,
        tokens: {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        },
      };
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
      //Xoa tokens va user data
      Cookies.remove("accessToken");
      localStorage.removeItem("currentUser");
      // Clear remembered email on logout
      clearRememberedEmail();
      return null;
    } catch (error) {
      Cookies.remove("accessToken");
      localStorage.removeItem("currentUser");
      // Clear remembered email even if logout fails
      clearRememberedEmail();
      return rejectWithValue(
        error.response ? error.response.data : error.message
      );
    }
  }
);

const initializeUserFromToken = () => {
  const token = Cookies.get("accessToken");
  if (!token) return null;
  // Kiểm tra token có hết hạn không
  if (isJWTExpired(token)) {
    Cookies.remove("accessToken");
    localStorage.removeItem("currentUser");
    return null;
  }

  const storedUser = localStorage.getItem("currentUser");
  if (storedUser) {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing stored user:", error);
    }
  }

  return getUserFromJWT(token);
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: initializeUserFromToken(),
    isLoading: false,
    error: null,
    isAuthenticated:
      !!Cookies.get("accessToken") && !isJWTExpired(Cookies.get("accessToken")),
    isInitialized: true, // Đánh dấu đã khởi tạo xong
    verifyingOtp: false,
    verifyOtpError: null,
    changingPassword: false,
    changePasswordError: null,
  },
  reducers: {
    clearAuth: (state) => {
      state.error = null;
      state.verifyOtpError = null;
      state.changePasswordError = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user = payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
        state.isAuthenticated = false;
      })

      // register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.error = null;
        // only set user if token returned
        if (payload?.tokens?.accessToken) {
          state.user = payload.user;
          state.isAuthenticated = true;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(register.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
        state.isAuthenticated = false;
      })

      // verifyOtp
      .addCase(verifyOtp.pending, (state) => {
        state.verifyingOtp = true;
        state.verifyOtpError = null;
      })
      .addCase(verifyOtp.fulfilled, (state, { payload }) => {
        state.verifyingOtp = false;
        state.verifyOtpError = null;
        if (payload?.tokens?.accessToken) {
          state.user = payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(verifyOtp.rejected, (state, { payload }) => {
        state.verifyingOtp = false;
        state.verifyOtpError = payload || { message: "Verify OTP failed" };
      })

      // googleLogin
      .addCase(googleLogin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleLogin.fulfilled, (state, { payload }) => {
        state.isLoading = false;
        state.user = payload.user;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(googleLogin.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
        state.isAuthenticated = false;
      })

      // logout
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logout.rejected, (state, { payload }) => {
        state.isLoading = false;
        state.error = payload;
      })

      // changePassword
      .addCase(changePassword.pending, (state) => {
        state.changingPassword = true;
        state.changePasswordError = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.changingPassword = false;
        state.changePasswordError = null;
      })
      .addCase(changePassword.rejected, (state, { payload }) => {
        state.changingPassword = false;
        state.changePasswordError = payload;
      });
  },
});

export const { clearAuth, setUser } = authSlice.actions;
export default authSlice.reducer;
