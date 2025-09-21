import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { supabase } from "@src/service/supabaseClient";
import { apiCache } from "@src/services";
import Cookies from "js-cookie";

const tokenFromCookie = Cookies.get("authToken");

// Async thunk for logging in
export const login = createAsyncThunk(
  "auth/login",
  async (
    formFields: {
      id: number;
      label: string;
      required: boolean;
      model: string;
      type?: string;
    }[],
    thunkAPI,
  ) => {
    try {
      // Extract email and password from formFields array
      const email = formFields[0].model;
      const password = formFields[1].model;

      // Attempt to sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Handle the case where an error occurred
      if (error) {
        return thunkAPI.rejectWithValue(error.message || "Login failed");
      }
      
      // Set cookie with token
      const token = data?.session?.access_token;
      if (token) {
        Cookies.set("authToken", token, {
          expires: 7,
          secure: true,
        });
      }

      // If successful, return the access token
      return token;
    } catch (error: any) {
      // Handle unexpected errors
      return thunkAPI.rejectWithValue(
        error.message || "An unexpected error occurred",
      );
    }
  },
);

// Async thunk for logout
export const logout = createAsyncThunk(
  "auth/logout",
  async (_, thunkAPI) => {
    try {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear cookies
      Cookies.remove("authToken");
      
      // Clear all cache on logout
      apiCache.clear();
      
      return null;
    } catch (error: any) {
      console.error("Error during logout:", error);
      // Even if there's an error, we should clear local state
      Cookies.remove("authToken");
      apiCache.clear();
      return null;
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: tokenFromCookie as string | null,
    isAuthenticated: Boolean(tokenFromCookie),
    status: "idle" as "idle" | "loading" | "succeeded" | "failed",
    error: null as string | null,
  },
  reducers: {
    // Reducer síncrono para limpiar estado (usado internamente)
    clearAuthState(state) {
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.status = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
      })
      // Logout cases
      .addCase(logout.pending, (state) => {
        state.status = "loading";
      })
      .addCase(logout.fulfilled, (state) => {
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.status = "idle";
      })
      .addCase(logout.rejected, (state) => {
        // Even if logout fails, clear the local state
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.status = "idle";
      });
  },
});

export const { clearAuthState } = authSlice.actions;

export default authSlice.reducer;
