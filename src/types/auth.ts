export interface User {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  groups?: string[];
  isAuthorized: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
}

export interface DecodedToken {
  aud: string;
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  aio?: string;
  groups?: string[];
  name: string;
  nonce: string;
  oid: string;
  preferred_username: string;
  rh?: string;
  sub: string;
  tid: string;
  uti: string;
  ver: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  jobTitle?: string;
}

export interface AuthError {
  errorCode: string;
  errorMessage: string;
  subError?: string;
  correlationId?: string;
}