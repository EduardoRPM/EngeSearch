import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ArticleWithId } from '../../core/models/article.model';

const WEBHOOK_URL = 'https://n8n.glimpse.uaslp.mx/webhook/3bd1443b-d95c-4486-b6e6-c7e6b2d2e444';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
}

@Component({
  selector: 'app-article-chat-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './article-chat-modal.component.html',
  styleUrl: './article-chat-modal.component.css',
})
export class ArticleChatModalComponent {
  @Input({ required: true }) article!: ArticleWithId;
  @Input() triggerLabel = 'Ask the article';

  @ViewChild('chatEnd') chatEndRef?: ElementRef<HTMLDivElement>;
  @ViewChild('textarea') textareaRef?: ElementRef<HTMLTextAreaElement>;

  isOpen = false;
  question = '';
  messages: ChatMessage[] = [];
  isLoading = false;

  open(): void {
    this.isOpen = true;
    setTimeout(() => this.textareaRef?.nativeElement.focus(), 0);
  }

  close(): void {
    this.isOpen = false;
    this.question = '';
    this.isLoading = false;
    this.messages = [];
  }

  async submit(): Promise<void> {
    const trimmedQuestion = this.question.trim();
    if (!trimmedQuestion || this.isLoading) {
      return;
    }

    this.messages = [
      ...this.messages,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        content: trimmedQuestion,
      },
    ];
    this.question = '';
    this.isLoading = true;

    try {
      const articleDetails = this.buildArticleDetails(trimmedQuestion);
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmedQuestion,
          articleTitle: this.article?.title,
          articleDetails,
        }),
      });

      let botText: string;
      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const data = await response.json();
        botText = this.extractBotText(data);
      } else {
        botText = await response.text();
      }

      this.messages = [
        ...this.messages,
        {
          id: `${Date.now()}-bot`,
          role: 'bot',
          content: botText || 'No response from bot.',
        },
      ];
    } catch (error) {
      console.error('Chat webhook error', error);
      this.messages = [
        ...this.messages,
        {
          id: `${Date.now()}-error`,
          role: 'bot',
          content: 'Connection error',
        },
      ];
    } finally {
      this.isLoading = false;
      setTimeout(() => this.chatEndRef?.nativeElement.scrollIntoView({ behavior: 'smooth' }), 0);
    }
  }

  private extractBotText(payload: unknown): string {
    const tryExtract = (value: unknown): string | null => {
      if (typeof value === 'string') {
        return value.trim() || null;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          const candidate = tryExtract(item);
          if (candidate) {
            return candidate;
          }
        }
        return null;
      }

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const candidateKeys = ['output', 'text', 'message', 'content'];
        for (const key of candidateKeys) {
          const candidate = record[key];
          if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
          }
        }
      }

      return null;
    };

    const extracted = tryExtract(payload);
    if (extracted) {
      return extracted;
    }

    if (payload == null) {
      return 'The bot did not send content.';
    }

    try {
      return JSON.stringify(payload, null, 2);
    } catch (error) {
      console.error('Cannot serialize bot response', error);
      return String(payload);
    }
  }

  private buildArticleDetails(question: string): string {
    const article = this.article;
    const citations = article?.citations;
    const formatted = article?.formatted_citations;

    const textSections = [
      'Pregunta del usuario:',
      question || 'No disponible',
      '',
      'Artículo',
      `Título: ${this.formatSimpleValue(article?.title)}`,
      `PMCID: ${this.formatSimpleValue(article?.pmcid)}`,
      `PMID: ${this.formatSimpleValue(article?.pmid)}`,
      `DOI: ${this.formatSimpleValue(article?.doi)}`,
      '',
      'Resumen / Abstract',
      this.formatParagraphValue(article?.abstract),
      '',
      'Resultados',
      this.formatParagraphValue(article?.results),
      '',
      'Conclusiones',
      this.formatParagraphValue(article?.conclusions),
      '',
      `Fuente: ${this.formatSimpleValue(article?.source)}`,
      `Título en PubMed: ${this.formatSimpleValue(article?.title_pubmed)}`,
      `Revista: ${this.formatSimpleValue(article?.journal)}`,
      `Año: ${this.formatSimpleValue(article?.year)}`,
      `Autores: ${this.formatListValue(article?.authors)}`,
      '',
      `Enlace: ${this.formatSimpleValue(article?.link)}`,
      '',
      'Citas',
      `Total: ${this.formatNumberValue(citations?.citation_count)}`,
      `Citaciones influyentes: ${this.formatNumberValue(citations?.influential_citation_count)}`,
      `Última actualización: ${this.formatSimpleValue(citations?.last_updated)}`,
      `Fuente: ${this.formatSimpleValue(citations?.source)}`,
      '',
      'Formatos de cita',
      `APA: ${this.formatSimpleValue(formatted?.apa)}`,
      `BibTeX: ${this.formatSimpleValue(formatted?.bibtex)}`,
      `PubMed: ${this.formatSimpleValue(formatted?.pubmed)}`,
    ];

    return textSections.join('\n');
  }

  private formatSimpleValue(value: string | null | undefined): string {
    if (value == null) {
      return 'No disponible';
    }
    const trimmed = String(value).trim();
    return trimmed || 'No disponible';
  }

  private formatParagraphValue(value: string[] | string | null | undefined): string {
    if (Array.isArray(value)) {
      const cleaned = value.map((paragraph) => paragraph.trim()).filter(Boolean);
      return cleaned.length ? cleaned.join('\n\n') : 'No disponible';
    }
    if (typeof value === 'string') {
      return value.trim() || 'No disponible';
    }
    return 'No disponible';
  }

  private formatListValue(value?: string[] | null): string {
    if (!value || !value.length) {
      return 'No disponible';
    }
    const cleaned = value.map((item) => item.trim()).filter(Boolean);
    return cleaned.length ? cleaned.join(', ') : 'No disponible';
  }

  private formatNumberValue(value?: number | null): string {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    return 'No disponible';
  }
}
