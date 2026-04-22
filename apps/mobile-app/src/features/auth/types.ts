export type AuthUser = {
  id: string;
  email: string;
  userName: string;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};