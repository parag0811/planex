import axiosInstance from "../lib/axios";

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  message: string;
}

export const register = async (data: RegisterPayload) => {
  const res = await axiosInstance.post<RegisterResponse>("/auth/register", data);
  return res.data;
};

interface UpdateProfileResponse {
  message: string;
  status: number;
}

export const updateProfile = async (data: FormData) => {
  const res = await axiosInstance.put<UpdateProfileResponse>("/auth/me", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};
