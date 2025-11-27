import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { buildApiUrl } from '../config/api.config';
import { AppRole } from './auth.service';

export interface UserProfile {
  _id: string;
  fullName: string;
  username: string;
  password: string;
  rol: AppRole;
}

const PROFILE_URL = buildApiUrl('/users/me');

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  getProfile() {
    return this.http.get<UserProfile>(PROFILE_URL);
  }

  fetchProfile(): Promise<UserProfile> {
    return firstValueFrom(this.getProfile());
  }
}
