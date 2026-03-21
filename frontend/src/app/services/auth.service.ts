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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = ApiConfig.baseUrl;

  constructor(private readonly http: HttpClient) {}

  signup(payload: SignupPayload): Observable<SignupUser> {
    return this.http
      .post<SignupApiResponse>(`${this.baseUrl}/signup`, payload)
      .pipe(map((response) => response.data));
  }
}
