import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { buildApiUrl } from '../config/api.config';
import { UserSavedArticle } from '../models/user-saved-article.model';
import { AuthService } from './auth.service';

const USER_SAVED_ARTICLES_URL = buildApiUrl('/user-saved-articles');

interface SaveArticleResponse {
  msg: string;
  savedArticle: UserSavedArticle;
}

@Injectable({ providedIn: 'root' })
export class UserSavedArticlesService {
  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService,
  ) {}

  async listForCurrentUser(): Promise<UserSavedArticle[]> {
    const userId = this.requireUserId();
    const params = new HttpParams().set('user_id', userId);
    return firstValueFrom(this.http.get<UserSavedArticle[]>(USER_SAVED_ARTICLES_URL, { params }));
  }

  async saveArticle(articleId: string): Promise<UserSavedArticle> {
    const userId = this.requireUserId();
    const payload = { user_id: userId, article_id: articleId };
    const response = await firstValueFrom(this.http.post<SaveArticleResponse>(USER_SAVED_ARTICLES_URL, payload));
    return response.savedArticle;
  }

  async deleteSavedArticle(recordId: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${USER_SAVED_ARTICLES_URL}/${recordId}`));
  }

  private requireUserId(): string {
    const userId = this.authService.getUserId();
    if (!userId) {
      throw new Error('No hay usuario autenticado para administrar los articulos guardados.');
    }
    return userId;
  }
}
