import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArticleCardComponent, ArticleCardData } from '../../shared/components/article-card/article-card.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, ArticleCardComponent],
  templateUrl: './my-articles.component.html',
  styleUrls: ['./my-articles.component.css'],
})
export class MyArticlesComponent {
  showForm = false;
  viewMode: 'grid' | 'list' = 'grid';
  articlesCount = 0;
  previewArticles: ArticleCardData[] = [];
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

  openForm(): void {
    this.showForm = true;
  }

  toggleView(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  closeForm(): void {
    this.showForm = false;
  }

  onSave(): void {
    const newArticle = this.buildPreviewCard();
    this.previewArticles = [...this.previewArticles, newArticle];
    this.updateArticlesCount();
    this.resetForm();
    this.closeForm();
  }

  onSend(): void {
    // Placeholder para futura integracion; por ahora actua como guardar
    this.onSave();
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
    this.articlesCount = this.previewArticles.length;
  }
}
