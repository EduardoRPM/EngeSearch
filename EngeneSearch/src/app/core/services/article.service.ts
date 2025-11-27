import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, map } from 'rxjs';
import { Article, ArticleStatus, ArticleWithId } from '../models/article.model';
import { deriveArticleId } from '../utils/article-utils';
import { buildApiUrl } from '../config/api.config';
import { UserSavedArticlesService } from './user-saved-articles.service';
import { AuthService } from './auth.service';

const ARTICLES_API_URL = buildApiUrl('/items');

export interface ArticleCreatePayload extends Partial<Omit<Article, '_id' | 'saved'>> {
  title: string;
  source: string;
  year: string;
  estadoItem?: string;
  createdBy?: string;
}

export type ArticleUpdatePayload = Partial<Omit<Article, '_id' | 'saved'>>;

interface ItemMutationResponse {
  msg: string;
  item: Article;
}

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private readonly savedIds = new Set<string>();
  private readonly savedRecordIds = new Map<string, string>();
  private readonly articlesSubject = new BehaviorSubject<ArticleWithId[]>([]);
  private readonly savedIdsSubject = new BehaviorSubject<Set<string>>(new Set(this.savedIds));
  private loadingPromise: Promise<ArticleWithId[]> | null = null;
  private savedStatePromise: Promise<void> | null = null;
  private lastSyncedUserId: string | null = null;

  constructor(
    private readonly http: HttpClient,
    private readonly savedArticlesService: UserSavedArticlesService,
    private readonly authService: AuthService,
  ) {
    this.authService.currentUser$.subscribe(() => {
      void this.refreshSavedStateFromServer(true);
    });
    void this.refreshSavedStateFromServer();
  }

  private async loadArticles(forceReload = false): Promise<ArticleWithId[]> {
    if (this.loadingPromise && !forceReload) {
      return this.loadingPromise;
    }

    this.loadingPromise = firstValueFrom(
      this.http.get<Article[]>(ARTICLES_API_URL).pipe(map((articles) => this.hydrateArticles(articles))),
    );

    try {
      const loaded = await this.loadingPromise;
      this.articlesSubject.next(loaded);
      this.savedIdsSubject.next(new Set(this.savedIds));
      return loaded;
    } finally {
      this.loadingPromise = null;
    }
  }

  private hydrateArticles(articles: Article[]): ArticleWithId[] {
    return articles.map((article, index) => {
      const id = this.resolveArticleId(article, index);
      const saved = this.savedIds.has(id) || Boolean(article.saved);
      return {
        ...article,
        id,
        saved,
      };
    });
  }

  getArticles(): Observable<ArticleWithId[]> {
    if (!this.loadingPromise && this.articlesSubject.value.length === 0) {
      void this.loadArticles();
    }
    return this.articlesSubject.asObservable();
  }

  async refreshArticles(): Promise<ArticleWithId[]> {
    return this.loadArticles(true);
  }

  getArticlesSnapshot(): ArticleWithId[] {
    return this.articlesSubject.value;
  }

  getSavedArticles(): Observable<ArticleWithId[]> {
    return this.getArticles().pipe(map((articles) => articles.filter((article) => article.saved)));
  }

  async setSavedState(articleId: string, saved: boolean): Promise<void> {
    if (saved) {
      await this.createSavedArticle(articleId);
    } else {
      await this.removeSavedArticle(articleId);
    }
    this.applySavedState(articleId, saved);
  }

  async toggleSaved(articleId: string): Promise<void> {
    const article = this.articlesSubject.value.find((item) => item.id === articleId);
    if (!article) {
      const shouldSave = !this.savedIds.has(articleId);
      await this.setSavedState(articleId, shouldSave);
    } else {
      await this.setSavedState(articleId, !article.saved);
    }
  }

  findById(articleId: string): ArticleWithId | undefined {
    return this.articlesSubject.value.find((article) => article.id === articleId);
  }

  getSavedIds(): Observable<Set<string>> {
    return this.savedIdsSubject.asObservable();
  }

  isSaved(articleId: string): boolean {
    return this.savedIds.has(articleId);
  }

  async createArticle(payload: ArticleCreatePayload): Promise<ArticleWithId> {
    const response = await firstValueFrom(this.http.post<ItemMutationResponse>(ARTICLES_API_URL, payload));
    const [created] = this.hydrateArticles([response.item]);
    this.addArticle(created);
    this.triggerRefresh();
    return created;
  }

  async updateArticle(id: string, changes: ArticleUpdatePayload): Promise<ArticleWithId> {
    const response = await firstValueFrom(
      this.http.put<ItemMutationResponse>(`${ARTICLES_API_URL}/${id}`, changes),
    );
    const [updated] = this.hydrateArticles([response.item]);
    this.replaceArticle(updated);
    this.triggerRefresh();
    return updated;
  }

  async updateArticleStatus(id: string, status: ArticleStatus): Promise<ArticleWithId> {
    return this.updateArticle(id, { status });
  }

  private resolveArticleId(article: Article, index: number): string {
    if (article._id) {
      return String(article._id);
    }
    return deriveArticleId(article, index);
  }

  private addArticle(article: ArticleWithId): void {
    const next = [...this.articlesSubject.value, article];
    this.articlesSubject.next(next);
  }

  private replaceArticle(article: ArticleWithId): void {
    const current = this.articlesSubject.value;
    const idx = current.findIndex((item) => item.id === article.id);
    if (idx === -1) {
      this.addArticle(article);
      return;
    }
    const next = [...current];
    next[idx] = article;
    this.articlesSubject.next(next);
  }

  private triggerRefresh(): void {
    void this.refreshArticles().catch((error) => {
      console.error('Failed to refresh articles after mutation', error);
    });
  }

  private async refreshSavedStateFromServer(force = false): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.lastSyncedUserId = null;
      this.savedIds.clear();
      this.savedRecordIds.clear();
      this.savedIdsSubject.next(new Set(this.savedIds));
      this.updateArticlesSavedFlags();
      return;
    }

    if (this.savedStatePromise) {
      return this.savedStatePromise;
    }

    if (!force && this.lastSyncedUserId === userId && this.savedRecordIds.size > 0) {
      return;
    }

    this.savedStatePromise = this.savedArticlesService
      .listForCurrentUser()
      .then((records) => {
        this.savedIds.clear();
        this.savedRecordIds.clear();

        records.forEach((record) => {
          this.savedIds.add(record.article_id);
          if (record._id) {
            this.savedRecordIds.set(record.article_id, record._id);
          }
        });

        this.savedIdsSubject.next(new Set(this.savedIds));
        this.updateArticlesSavedFlags();
        this.lastSyncedUserId = userId;
      })
      .catch((error) => {
        console.error('Failed to fetch saved articles', error);
      })
      .finally(() => {
        this.savedStatePromise = null;
      });

    await this.savedStatePromise;
  }

  private async createSavedArticle(articleId: string): Promise<void> {
    try {
      const savedArticle = await this.savedArticlesService.saveArticle(articleId);
      if (savedArticle?._id) {
        this.savedRecordIds.set(articleId, savedArticle._id);
      }
    } catch (error) {
      if (this.isConflictError(error)) {
        await this.refreshSavedStateFromServer(true);
        return;
      }
      throw error;
    }
  }

  private async removeSavedArticle(articleId: string): Promise<void> {
    let recordId = this.savedRecordIds.get(articleId);
    if (!recordId) {
      await this.refreshSavedStateFromServer(true);
      recordId = this.savedRecordIds.get(articleId);
      if (!recordId) {
        return;
      }
    }

    await this.savedArticlesService.deleteSavedArticle(recordId);
    this.savedRecordIds.delete(articleId);
  }

  private applySavedState(articleId: string, saved: boolean): void {
    if (saved) {
      this.savedIds.add(articleId);
    } else {
      this.savedIds.delete(articleId);
    }

    this.savedIdsSubject.next(new Set(this.savedIds));
    this.updateArticlesSavedFlags();
  }

  private updateArticlesSavedFlags(): void {
    const current = this.articlesSubject.value;
    if (current.length === 0) {
      return;
    }

    let modified = false;
    const next = current.map((article) => {
      const saved = this.savedIds.has(article.id);
      if (article.saved === saved) {
        return article;
      }
      modified = true;
      return {
        ...article,
        saved,
      };
    });

    if (modified) {
      this.articlesSubject.next(next);
    }
  }

  private isConflictError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 409;
  }
}
