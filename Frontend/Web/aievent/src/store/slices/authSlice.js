import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authAPI } from "../../api/fetcher";
import Cookies from "js-cookie";
import { getUserFromJWT, isJWTExpired } from "../../lib/jwtUtils";

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { data } = response;
      
      //lưu accessToken vào cookies
      Cookies.set("accessToken", data.accessToken, {
            expires: new Date(data.expiresAt),
            secure : true,
            sameSite : 'strict'
    });

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
      }
    };

    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
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

      return null;
  } catch (error) {
    Cookies.remove("accessToken");
    localStorage.removeItem("currentUser");
    
    return rejectWithValue(error.response ? error.response.data : error.message);
  }
});


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
    isAuthenticated: !!Cookies.get("accessToken") && !isJWTExpired(Cookies.get("accessToken")),
  },
  reducers: {
    clearAuth: (state) => {
      state.error = null;
  },
  setUser: (state, action) => {
    state.user = action.payload;
    state.isAuthenticated = !!action.payload;
  },
},
  extraReducers: (builder) => {
    builder
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
      });
      },
  });

export const { clearAuth, setUser } = authSlice.actions;
export default authSlice.reducer;