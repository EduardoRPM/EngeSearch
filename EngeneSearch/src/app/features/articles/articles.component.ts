import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ArticleService } from '../../core/services/article.service';
import { ArticleStatus, ArticleWithId } from '../../core/models/article.model';
import { buildDescription, formatAuthor } from '../../core/utils/article-utils';

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css',
})
export class ArticlesComponent implements OnInit {
  statuses: ArticleStatus[] = ['Aceptado', 'Rechazado', 'En revision'];
  currentStatus: ArticleStatus = 'Aceptado';

  showRejectModal = false;
  rejectFeedback = '';
  rejectError = '';
  selectedArticle: ArticleWithId | null = null;
  statusError: string | null = null;
  loadError: string | null = null;
  private readonly pendingStatusUpdates = new Set<string>();
  private readonly articlesByStatus = new Map<ArticleStatus, ArticleWithId[]>();
  private readonly loadedStatuses = new Set<ArticleStatus>();
  private readonly loadingStatuses = new Set<ArticleStatus>();

  constructor(private readonly articleService: ArticleService) {}

  ngOnInit(): void {
    void this.loadArticlesForStatus(this.currentStatus);
  }

  get filteredArticles(): ArticleWithId[] {
    return this.articlesByStatus.get(this.currentStatus) ?? [];
  }

  get isCurrentStatusLoading(): boolean {
    return this.loadingStatuses.has(this.currentStatus);
  }

  setStatusFilter(status: ArticleStatus): void {
    this.currentStatus = status;
    this.loadError = null;
    if (!this.loadedStatuses.has(status) && !this.loadingStatuses.has(status)) {
      void this.loadArticlesForStatus(status);
    }
  }

  async acceptArticle(article: ArticleWithId): Promise<void> {
    await this.changeStatus(article, 'Aceptado');
  }

  openRejectModal(article: ArticleWithId): void {
    this.selectedArticle = article;
    this.rejectFeedback = '';
    this.rejectError = '';
    this.showRejectModal = true;
  }

  async confirmReject(): Promise<void> {
    if (!this.selectedArticle) {
      return;
    }
    if (!this.rejectFeedback.trim()) {
      this.rejectError = 'Agrega feedback para rechazar el articulo.';
      return;
    }
    try {
      await this.changeStatus(this.selectedArticle, 'Rechazado');
      this.closeRejectModal();
    } catch {
      this.rejectError = 'No se pudo rechazar el articulo. Intenta nuevamente.';
    }
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedArticle = null;
    this.rejectFeedback = '';
    this.rejectError = '';
  }

  getArticleTitle(article: ArticleWithId): string {
    return article.title ?? article.title_pubmed ?? 'Articulo sin titulo';
  }

  getArticleAuthor(article: ArticleWithId): string {
    return formatAuthor(article.authors ?? []) ?? 'Autor desconocido';
  }

  getArticleSummary(article: ArticleWithId): string {
    return buildDescription(article) ?? 'Sin resumen disponible.';
  }

  getStatusLabel(article: ArticleWithId): ArticleStatus {
    return this.normalizeStatus(article);
  }

  isPendingReview(article: ArticleWithId): boolean {
    return this.normalizeStatus(article) === 'En revision';
  }

  isStatusUpdating(article: ArticleWithId): boolean {
    return this.pendingStatusUpdates.has(article.id);
  }

  trackByArticleId(_index: number, article: ArticleWithId): string {
    return article.id;
  }

  private normalizeStatus(article: ArticleWithId): ArticleStatus {
    if (article.status === 'Aceptado' || article.status === 'Rechazado') {
      return article.status;
    }
    return 'En revision';
  }

  private async changeStatus(article: ArticleWithId, status: ArticleStatus): Promise<void> {
    if (this.pendingStatusUpdates.has(article.id)) {
      return;
    }
    this.statusError = null;
    const previousStatus = this.normalizeStatus(article);
    this.pendingStatusUpdates.add(article.id);
    try {
      const updated = await this.articleService.updateArticleStatus(article.id, status);
      this.handleArticleStatusChange(updated, previousStatus);
    } catch (error) {
      console.error('Failed to update article status', error);
      this.statusError = 'No se pudo actualizar el estado. Intenta nuevamente.';
      throw error;
    } finally {
      this.pendingStatusUpdates.delete(article.id);
    }
  }

  private async loadArticlesForStatus(status: ArticleStatus): Promise<void> {
    if (this.loadingStatuses.has(status)) {
      return;
    }
    this.loadingStatuses.add(status);
    try {
      const articles = await this.articleService.fetchArticlesByStatus(status);
      this.articlesByStatus.set(status, articles);
      this.loadedStatuses.add(status);
      this.loadError = null;
    } catch (error) {
      console.error('Failed to load articles by status', error);
      this.loadError = `No se pudo cargar los articulos con estado ${status}. Intenta nuevamente.`;
    } finally {
      this.loadingStatuses.delete(status);
    }
  }

  private handleArticleStatusChange(updatedArticle: ArticleWithId, previousStatus: ArticleStatus): void {
    const nextStatus = this.normalizeStatus(updatedArticle);

    if (previousStatus === nextStatus) {
      if (this.loadedStatuses.has(previousStatus)) {
        this.upsertArticleInStatusList(previousStatus, updatedArticle);
      }
      return;
    }

    if (this.loadedStatuses.has(previousStatus)) {
      this.removeArticleFromStatusList(previousStatus, updatedArticle.id);
    }

    if (this.loadedStatuses.has(nextStatus)) {
      this.upsertArticleInStatusList(nextStatus, updatedArticle);
    } else {
      this.loadedStatuses.delete(nextStatus);
      this.articlesByStatus.delete(nextStatus);
    }
  }

  private removeArticleFromStatusList(status: ArticleStatus, articleId: string): void {
    const articles = this.articlesByStatus.get(status);
    if (!articles) {
      return;
    }
    const next = articles.filter((item) => item.id !== articleId);
    this.articlesByStatus.set(status, next);
  }

  private upsertArticleInStatusList(status: ArticleStatus, article: ArticleWithId): void {
    const articles = this.articlesByStatus.get(status) ?? [];
    const idx = articles.findIndex((item) => item.id === article.id);
    if (idx === -1) {
      this.articlesByStatus.set(status, [article, ...articles]);
      return;
    }
    const next = [...articles];
    next[idx] = article;
    this.articlesByStatus.set(status, next);
  }
}
