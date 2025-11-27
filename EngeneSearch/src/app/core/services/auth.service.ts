import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { buildApiUrl } from '../config/api.config';

export type AppRole = 'admin' | 'user';

const LOGIN_URL = buildApiUrl('/auth/login');
const REGISTER_URL = buildApiUrl('/auth/register');
const AUTH_STORAGE_KEY = 'engenesearch.authState';

interface LoginResponse {
  msg: string;
  token: string;
  role: AppRole;
  username: string;
}

interface RegisterResponse {
  msg: string;
  role?: AppRole;
}

interface AuthState {
  token: string;
  role: AppRole;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authStateSubject = new BehaviorSubject<AuthState | null>(this.readStoredState());
  readonly currentUser$ = this.authStateSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  async login(username: string, password: string): Promise<void> {
    const trimmedUsername = username.trim();
    const payload = { username: trimmedUsername, password };
    const response = await firstValueFrom(this.http.post<LoginResponse>(LOGIN_URL, payload));
    if (!response?.token || !response?.role) {
      throw new Error('Respuesta inválida del servidor: falta información de autenticación.');
    }
    this.saveState({
      token: response.token,
      role: response.role,
      username: response.username ?? trimmedUsername,
    });
  }

  async register(username: string, password: string): Promise<void> {
    const trimmedUsername = username.trim();
    const payload = { username: trimmedUsername, password };
    await firstValueFrom(this.http.post<RegisterResponse>(REGISTER_URL, payload));
  }

  logout(): void {
    this.saveState(null);
  }

  getToken(): string | null {
    return this.authStateSubject.value?.token ?? null;
  }

  getRole(): AppRole | null {
    return this.authStateSubject.value?.role ?? null;
  }

  isAuthenticated(): boolean {
    return Boolean(this.authStateSubject.value?.token);
  }

  hasAnyRole(roles: AppRole[]): boolean {
    const role = this.getRole();
    if (!role) {
      return false;
    }
    return roles.includes(role);
  }

  private saveState(state: AuthState | null): void {
    if (state) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.authStateSubject.next(state);
  }

  private readStoredState(): AuthState | null {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as Partial<AuthState>;
      if (parsed && parsed.token && parsed.role && parsed.username) {
        return {
          token: parsed.token,
          role: parsed.role,
          username: parsed.username,
        };
      }
    } catch (error) {
      console.error('No se pudo leer el estado de autenticación almacenado', error);
    }
    return null;
  }
}
