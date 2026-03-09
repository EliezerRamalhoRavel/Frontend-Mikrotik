import api from "@/lib/axios";
import type { LoginCredentials, AuthResponse, LoginResponse, User } from "@/types/api";

interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
}

interface TwoFactorSetupResponse {
    secret: string;
    uri: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);
    
    if (credentials.code_2fa) {
      formData.append("code", credentials.code_2fa);
    }

    try {
      const { data: tokenData } = await api.post<LoginResponse>("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const { data: userData } = await api.get<User>("/users/me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      return {
        access_token: tokenData.access_token,
        user: userData,
      };

    } catch (error: any) {
      const responseData = error.response?.data;
      
      if (error.response?.status === 403 && responseData) {
        if (responseData.error === "AUTH_MFA_SETUP_REQUIRED") {
            throw { 
                isMfaSetupRequired: true, 
                qrCodeUri: responseData.message.uri,
                secret: responseData.message.secret,
                message: "MFA Setup Necessário" 
            };
        }
        
        if (responseData.error === "AUTH_MFA_TOKEN_EXPIRED" || responseData.error === "AUTH_MFA_REQUIRED") {
            throw { is2faRequired: true, message: responseData.message || "Código MFA Necessário" };
        }
      }
      throw error;
    }
  },
  
  logout: async () => {
    await api.post("/auth/logout");
  },

  getCurrentUser: async () => {
    const { data } = await api.get<User>("/users/me");
    return data;
  },
  
  updateProfile: async (data: { full_name: string }) => {
      const { data: user } = await api.patch<User>("/users/me", data);
      return user;
  },

  changePassword: async (data: ChangePasswordPayload) => {
      await api.patch("/users/me/change-password", data);
  },

  setup2fa: async (): Promise<TwoFactorSetupResponse> => {
      const { data } = await api.post<TwoFactorSetupResponse>("/auth/2fa/setup");
      return data;
  },

  enable2fa: async (code: string) => {
      await api.post("/auth/2fa/enable", { code });
  },

  disable2fa: async () => {
      await api.post("/auth/2fa/disable");
  }
};