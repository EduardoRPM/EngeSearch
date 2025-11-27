import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { buildApiUrl } from '../config/api.config';

interface RawUser {
  _id: string;
  username: string;
  password?: string;
  rol?: string;
}

interface RawUsersResponse {
  msg: string;
  result: RawUser[];
}

interface RawUserResponse {
  msg: string;
  result: RawUser;
}

interface RawMessageResponse {
  msg: string;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly base = buildApiUrl('/users');

  constructor(private readonly http: HttpClient) {}

  async getAll(): Promise<RawUsersResponse> {
    return firstValueFrom(this.http.get<RawUsersResponse>(this.base));
  }

  async updateRole(userId: string, rol: string): Promise<RawUserResponse> {
    return firstValueFrom(
      this.http.put<RawUserResponse>(`${this.base}/${userId}/role`, { rol })
    );
  }

  async delete(userId: string): Promise<RawMessageResponse> {
    return firstValueFrom(this.http.delete<RawMessageResponse>(`${this.base}/${userId}`));
  }
}
