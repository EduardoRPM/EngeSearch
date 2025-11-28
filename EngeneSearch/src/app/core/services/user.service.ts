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
const PROFILE_PASSWORD_URL = buildApiUrl('/users/me/password');

interface MessageResponse {
  msg: string;
}

interface RawProfileResponse {
  msg: string;
  result: UserProfile;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  getProfile() {
    return this.http.get<RawProfileResponse>(PROFILE_URL);
  }

  fetchProfile(): Promise<UserProfile> {
    return firstValueFrom(this.getProfile()).then((res) => res.result);
  }

  updatePassword(newPassword: string): Promise<MessageResponse> {
    return firstValueFrom(
      this.http.put<MessageResponse>(PROFILE_PASSWORD_URL, { newPassword })
    );
  }
}
