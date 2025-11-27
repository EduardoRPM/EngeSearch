import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ArticleCardComponent, ArticleCardData } from '../../shared/components/article-card/article-card.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { ArticleService, ArticleCreatePayload } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { ArticleWithId } from '../../core/models/article.model';
import { buildDescription, formatAuthor } from '../../core/utils/article-utils';

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
  // 'edicion' shows articles in editing, 'revision' shows articles in revision, 'evaluados' shows accepted/rejected created by user
  selectedSection: 'edicion' | 'revision' | 'evaluados' = 'edicion';
  // statuses for the UI chip design (key/label)
  statuses: Array<{ key: 'edicion' | 'revision' | 'evaluados'; label: string }> = [
    { key: 'edicion', label: 'Articulos en edicion' },
    { key: 'revision', label: 'Articulos en revision' },
    { key: 'evaluados', label: 'Artículos Evaluados' },
  ];
  currentStatusKey: 'edicion' | 'revision' | 'evaluados' = 'edicion';
  articlesCount = 0;
  isSubmitting = false;
  showResultModal = false;
  resultTitle = '';
  resultMessage = '';
  resultIsError = false;
  isEditingExisting = false;
  private editingArticleId: string | null = null;
  private readonly subscriptions: Subscription[] = [];
  private userArticles: ArticleWithId[] = [];

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

  get editingArticles(): ArticleCardData[] {
    return this.filterArticlesByState('enEdicion');
  }

  get revisionArticles(): ArticleCardData[] {
    return this.filterArticlesByState('enRevision');
  }

  openForm(): void {
    this.showForm = true;
  }

  toggleView(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  selectSection(section: 'edicion' | 'revision' | 'evaluados'): void {
    this.selectedSection = section;
  }

  setStatusFilter(key: 'edicion' | 'revision' | 'evaluados'): void {
    this.currentStatusKey = key;
    this.selectSection(key);
  }

  /**
   * Articles that were evaluated (accepted or rejected) and were created by the current user
   */
  get evaluatedArticles(): ArticleCardData[] {
    const userId = this.authService.getUserId();
    if (!userId) {
      return [];
    }
    return this.userArticles
      .filter((article) => article.createdBy === userId && ['aceptado', 'rechazado'].includes((article.estadoItem ?? '').toLowerCase()))
      .map((article) => this.mapServerArticle(article));
  }

  statusCount(key: 'edicion' | 'revision' | 'evaluados'): number {
    if (key === 'edicion') return this.editingArticles.length;
    if (key === 'revision') return this.revisionArticles.length;
    return this.evaluatedArticles.length;
  }

  closeForm(): void {
    this.showForm = false;
    this.isEditingExisting = false;
    this.editingArticleId = null;
    this.resetForm();
  }

  async onSave(): Promise<void> {
    const title = this.isEditingExisting ? 'Articulo actualizado' : 'Articulo guardado';
    const message = this.isEditingExisting
      ? 'Los cambios se guardaron correctamente.'
      : 'El articulo se guardo correctamente.';
    await this.submitArticle(title, message, 'enEdicion');
  }

  async onSend(): Promise<void> {
    const title = this.isEditingExisting ? 'Articulo enviado' : 'Articulo enviado';
    const message = this.isEditingExisting
      ? 'El articulo se envio para revision.'
      : 'El articulo se envio correctamente.';
    await this.submitArticle(title, message, 'enRevision');
  }

  trackByArticleId(_index: number, article: ArticleCardData): string {
    return article.id;
  }

  startEdit(articleId: string): void {
    const article = this.userArticles.find((item) => item.id === articleId && (item.estadoItem ?? 'enRevision') === 'enEdicion');
    if (!article) {
      return;
    }
    this.populateFormFromArticle(article);
    this.isEditingExisting = true;
    this.editingArticleId = articleId;
    this.showForm = true;
  }

  private populateFormFromArticle(article: ArticleWithId): void {
    this.formData = {
      title: article.title ?? '',
      pmcid: article.pmcid ?? '',
      pmid: article.pmid ?? '',
      doi: article.doi ?? '',
      year: article.year ?? '',
      summary: (article.abstract && article.abstract[0]) || '',
      authors: (article.authors ?? []).join(', '),
      keywords: (article.keywords ?? []).join(', '),
      topics: (article.topics ?? []).join(', '),
      mesh: (article.mesh_terms ?? []).join(', '),
      link: article.link ?? '',
    };
  }

  private splitValues(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private buildMutationPayload(estadoItem: string, includeCreatedBy: boolean): ArticleCreatePayload {
    const keywords = this.splitValues(this.formData.keywords);
    const topics = this.splitValues(this.formData.topics);
    const meshTerms = this.splitValues(this.formData.mesh);
    const authors = this.splitValues(this.formData.authors);

    const payload: ArticleCreatePayload = {
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
    };

    const createdBy = this.authService.getUserId();
    if (includeCreatedBy && createdBy) {
      payload.createdBy = createdBy;
    }

    return payload;
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
      const payload = this.buildMutationPayload(estadoItem, !this.isEditingExisting);
      if (this.isEditingExisting && this.editingArticleId) {
        await this.articleService.updateArticle(this.editingArticleId, payload);
      } else {
        await this.articleService.createArticle(payload);
      }
      this.closeForm();
      this.showSuccess(successTitle, `${successMessage} Se sincronizo con el servidor.`);
    } catch (error) {
      console.error('Error al guardar articulo', error);
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
    this.articlesCount = this.userArticles.length;
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
    this.userArticles = articles.filter((article) => article.createdBy === userId);
    this.updateArticlesCount();
  }

  private filterArticlesByState(target: string): ArticleCardData[] {
    return this.userArticles
      .filter((article) => (article.estadoItem ?? 'enRevision') === target)
      .map((article) => this.mapServerArticle(article));
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
