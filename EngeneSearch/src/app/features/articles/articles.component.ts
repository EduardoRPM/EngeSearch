import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../shared/components/header/header.component';

type ArticleStatus = 'Aceptado' | 'Rechazado' | 'En revision';

interface ArticleItem {
  id: string;
  title: string;
  author: string;
  summary: string;
  status: ArticleStatus;
}

@Component({
  selector: 'app-articles',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './articles.component.html',
  styleUrl: './articles.component.css',
})
export class ArticlesComponent {
  statuses: ArticleStatus[] = ['Aceptado', 'Rechazado', 'En revision'];
  currentStatus: ArticleStatus = 'Aceptado';

  articles: ArticleItem[] = [
    {
      id: 'a-1',
      title: 'Predictive models in healthcare',
      author: 'Maria Lopez',
      summary: 'Explora modelos predictivos y su impacto en decisiones clinicas.',
      status: 'Aceptado',
    },
    {
      id: 'a-2',
      title: 'AI for rare diseases',
      author: 'Carlos Ruiz',
      summary: 'Uso de IA para diagnostico temprano en enfermedades raras.',
      status: 'En revision',
    },
    {
      id: 'a-3',
      title: 'Genomic pipelines at scale',
      author: 'Laura Vega',
      summary: 'Pipeline de datos genomicos y retos de escalabilidad.',
      status: 'Rechazado',
    },
  ];

  showRejectModal = false;
  rejectFeedback = '';
  rejectError = '';
  selectedArticle: ArticleItem | null = null;

  get filteredArticles(): ArticleItem[] {
    return this.articles.filter((article) => article.status === this.currentStatus);
  }

  setStatusFilter(status: ArticleStatus): void {
    this.currentStatus = status;
  }

  acceptArticle(article: ArticleItem): void {
    this.updateStatus(article.id, 'Aceptado');
  }

  openRejectModal(article: ArticleItem): void {
    this.selectedArticle = article;
    this.rejectFeedback = '';
    this.rejectError = '';
    this.showRejectModal = true;
  }

  confirmReject(): void {
    if (!this.selectedArticle) {
      return;
    }
    if (!this.rejectFeedback.trim()) {
      this.rejectError = 'Agrega feedback para rechazar el articulo.';
      return;
    }
    this.updateStatus(this.selectedArticle.id, 'Rechazado');
    this.closeRejectModal();
  }

  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedArticle = null;
    this.rejectFeedback = '';
    this.rejectError = '';
  }

  private updateStatus(id: string, status: ArticleStatus): void {
    this.articles = this.articles.map((article) =>
      article.id === id ? { ...article, status } : article,
    );
  }
}
