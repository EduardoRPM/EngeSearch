import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArticleCardComponent, ArticleCardData } from '../../shared/components/article-card/article-card.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ArticleService, ArticleCreatePayload } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { ArticleWithId } from '../../core/models/article.model';
import { buildDescription, formatAuthor } from '../../core/utils/article-utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, ArticleCardComponent],
  templateUrl: './my-articles.component.html',
  styleUrls: ['./my-articles.component.css'],
})
export class MyArticlesComponent implements OnDestroy {
  showForm = false;
  viewMode: 'grid' | 'list' = 'grid';
  articlesCount = 0;
  previewArticles: ArticleCardData[] = [];
  userArticles: ArticleCardData[] = [];
  isSubmitting = false;
  showResultModal = false;
  resultTitle = '';
  resultMessage = '';
  resultIsError = false;
  formData = {
    title: '',
    pmcid: '',
    pmid: '',
    doi: '',
    year: '',
    summary: '',
    authors: '',
    keywords: '',
    topics: '',
    mesh: '',
    link: '',
  };

  private readonly subscriptions: Subscription[] = [];

  constructor(
    private readonly articleService: ArticleService,
    private readonly authService: AuthService,
  ) {
    const sub = this.articleService.getArticles().subscribe((articles) => {
      this.loadUserArticles(articles);
    });
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  openForm(): void {
    this.showForm = true;
  }

  toggleView(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  closeForm(): void {
    this.showForm = false;
  }

  async onSave(): Promise<void> {
    await this.submitArticle('Articulo guardado', 'El articulo se guardo correctamente.', 'enEdicion');
  }

  async onSend(): Promise<void> {
    await this.submitArticle('Articulo enviado', 'El articulo se envio correctamente.', 'enRevision');
  }

  get displayedArticles(): ArticleCardData[] {
    return [...this.userArticles, ...this.previewArticles];
  }

  trackByArticleId(_index: number, article: ArticleCardData): string {
    return article.id;
  }

  private buildPreviewCard(): ArticleCardData {
    const keywords = this.splitValues(this.formData.keywords);
    const topics = this.splitValues(this.formData.topics);
    const tags = [...keywords, ...topics].slice(0, 6);

    return {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: this.formData.title || 'Borrador sin titulo',
      year: this.formData.year || undefined,
      author: this.formData.authors.split(',')[0]?.trim() || undefined,
      description: this.formData.summary,
      tags,
      link: this.formData.link || null,
      badge: this.formData.pmcid || this.formData.doi || this.formData.pmid || undefined,
      likes: 0,
      comments: 0,
      image: '/assets/logoN.png',
    };
  }

  private splitValues(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private buildCreatePayload(estadoItem: string): ArticleCreatePayload {
    const keywords = this.splitValues(this.formData.keywords);
    const topics = this.splitValues(this.formData.topics);
    const meshTerms = this.splitValues(this.formData.mesh);
    const authors = this.splitValues(this.formData.authors);

    const createdBy = this.authService.getUserId() || undefined;

    return {
      title: this.formData.title.trim(),
      pmcid: this.formData.pmcid || undefined,
      pmid: this.formData.pmid || undefined,
      doi: this.formData.doi || undefined,
      year: this.formData.year || String(new Date().getFullYear()),
      source: 'user-submitted',
      abstract: this.formData.summary ? [this.formData.summary.trim()] : undefined,
      results: [],
      conclusions: [],
      authors,
      keywords,
      topics,
      mesh_terms: meshTerms,
      link: this.formData.link || undefined,
      status: 'En revision',
      estadoItem,
      createdBy,
    };
  }

  private async submitArticle(successTitle: string, successMessage: string, estadoItem: string): Promise<void> {
    if (this.isSubmitting) {
      return;
    }
    if (!this.formData.title.trim() || !this.formData.summary.trim()) {
      this.showError('Campos incompletos', 'Completa el titulo y el resumen antes de continuar.');
      return;
    }

    this.isSubmitting = true;
    try {
      const payload = this.buildCreatePayload(estadoItem);
      await this.articleService.createArticle(payload);
      const newArticle = this.buildPreviewCard();
      this.previewArticles = [...this.previewArticles, newArticle];
      this.updateArticlesCount();
      this.resetForm();
      this.closeForm();
      this.showSuccess(successTitle, `${successMessage} Se envio para revision a traves del servidor.`);
    } catch (error) {
      console.error('Error al enviar articulo', error);
      this.showError('No se pudo completar la accion', 'Intentalo nuevamente mas tarde.');
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm(): void {
    this.formData = {
      title: '',
      pmcid: '',
      pmid: '',
      doi: '',
      year: '',
      summary: '',
      authors: '',
      keywords: '',
      topics: '',
      mesh: '',
      link: '',
    };
  }

  private updateArticlesCount(): void {
    this.articlesCount = this.displayedArticles.length;
  }

  private showSuccess(title: string, message: string): void {
    this.resultTitle = title;
    this.resultMessage = message;
    this.resultIsError = false;
    this.showResultModal = true;
  }

  private showError(title: string, message: string): void {
    this.resultTitle = title;
    this.resultMessage = message;
    this.resultIsError = true;
    this.showResultModal = true;
  }

  closeResultModal(): void {
    this.showResultModal = false;
  }

  private loadUserArticles(articles: ArticleWithId[]): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.userArticles = [];
      this.updateArticlesCount();
      return;
    }
    this.userArticles = articles
      .filter((article) => article.createdBy === userId)
      .map((article) => this.mapServerArticle(article));
    this.updateArticlesCount();
  }

  private mapServerArticle(article: ArticleWithId): ArticleCardData {
    return {
      id: article.id,
      title: article.title ?? article.title_pubmed ?? 'Articulo sin titulo',
      year: article.year ?? undefined,
      author: formatAuthor(article.authors ?? []) ?? undefined,
      description: buildDescription(article) ?? undefined,
      tags: (article.keywords ?? []).slice(0, 6),
      link: article.link ?? null,
      badge: article.estadoItem ?? article.status ?? undefined,
      likes: article.citations?.citation_count ?? 0,
      comments: article.topics?.length ?? 0,
      image: '/assets/logoN.png',
    };
  }
}
