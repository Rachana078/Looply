export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
}

export interface AuthResponse {
  accessToken: string;
  user: UserProfile;
}
