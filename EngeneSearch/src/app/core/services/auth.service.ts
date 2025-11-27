import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { buildApiUrl } from '../config/api.config';

const LOGIN_URL = buildApiUrl('/auth/login');
const REGISTER_URL = buildApiUrl('/auth/register');
const AUTH_TOKEN_STORAGE_KEY = 'engenesearch.authToken';

interface LoginResponse {
  msg: string;
  token: string;
}

interface RegisterResponse {
  msg: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  async login(username: string, password: string): Promise<void> {
    const trimmedUsername = username.trim();
    const payload = { username: trimmedUsername, password };
    const response = await firstValueFrom(this.http.post<LoginResponse>(LOGIN_URL, payload));
    if (!response?.token) {
      throw new Error('Respuesta inválida del servidor: falta el token.');
    }
    this.persistToken(response.token);
  }

  async register(username: string, password: string): Promise<void> {
    const trimmedUsername = username.trim();
    const payload = { username: trimmedUsername, password };
    await firstValueFrom(this.http.post<RegisterResponse>(REGISTER_URL, payload));
  }

  logout(): void {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  }

  private persistToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  }
}
