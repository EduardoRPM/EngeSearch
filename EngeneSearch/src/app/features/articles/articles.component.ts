import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
export class ArticlesComponent implements OnDestroy {
  statuses: ArticleStatus[] = ['Aceptado', 'Rechazado', 'En revision'];
  currentStatus: ArticleStatus = 'Aceptado';
  articles: ArticleWithId[] = [];

  showRejectModal = false;
  rejectFeedback = '';
  rejectError = '';
  selectedArticle: ArticleWithId | null = null;
  statusError: string | null = null;
  private readonly pendingStatusUpdates = new Set<string>();
  private readonly subscription: Subscription;

  constructor(private readonly articleService: ArticleService) {
    this.subscription = this.articleService.getArticles().subscribe((articles) => {
      this.articles = articles;
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  get filteredArticles(): ArticleWithId[] {
    return this.articles.filter((article) => this.normalizeStatus(article) === this.currentStatus);
  }

  setStatusFilter(status: ArticleStatus): void {
    this.currentStatus = status;
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
    this.pendingStatusUpdates.add(article.id);
    try {
      await this.articleService.updateArticleStatus(article.id, status);
    } catch (error) {
      console.error('Failed to update article status', error);
      this.statusError = 'No se pudo actualizar el estado. Intenta nuevamente.';
      throw error;
    } finally {
      this.pendingStatusUpdates.delete(article.id);
    }
  }
}
