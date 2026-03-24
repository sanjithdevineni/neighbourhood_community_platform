import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiConfig } from '../config/api.config';

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignupUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface SignupApiResponse {
  data: SignupUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface LoginResult {
  token: string;
  user: LoginUser;
}

interface LoginApiResponse {
  data: LoginResult;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = ApiConfig.baseUrl;
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'auth_user';

  constructor(private readonly http: HttpClient) {}

  signup(payload: SignupPayload): Observable<SignupUser> {
    return this.http
      .post<SignupApiResponse>(`${this.baseUrl}/signup`, payload)
      .pipe(map((response) => response.data));
  }

  login(payload: LoginPayload): Observable<LoginResult> {
    return this.http
      .post<LoginApiResponse>(`${this.baseUrl}/login`, payload)
      .pipe(map((response) => response.data));
  }

  storeAuthSession(result: LoginResult): void {
    localStorage.setItem(this.tokenKey, result.token);
    localStorage.setItem(this.userKey, JSON.stringify(result.user));
  }

  clearAuthSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getStoredUser(): LoginUser | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginUser;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}
