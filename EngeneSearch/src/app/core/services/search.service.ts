import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SearchArticleResult } from '../models/article.model';
import { buildApiUrl } from '../config/api.config';

const SEARCH_API_URL = buildApiUrl('/items/search');

export interface SearchInput {
  keywords?: string[];
  text?: string;
  limit?: number;
}

interface SearchPayload {
  keywords?: string[];
  text?: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  constructor(private readonly http: HttpClient) {}

  async search(input: SearchInput): Promise<SearchArticleResult[]> {
    const payload = this.buildPayload(input);
    if (!payload.text && (!payload.keywords || payload.keywords.length === 0)) {
      return [];
    }

    const results = await firstValueFrom(this.http.post<SearchArticleResult[]>(SEARCH_API_URL, payload));
    return results;
  }

  private buildPayload(input: SearchInput): SearchPayload {
    const normalizedKeywords = this.normalizeKeywords(input.keywords ?? []);
    const text = typeof input.text === 'string' ? input.text.trim() : '';
    const limit =
      typeof input.limit === 'number' && input.limit > 0 ? Math.min(input.limit, 40) : undefined;

    return {
      keywords: normalizedKeywords.length > 0 ? normalizedKeywords : undefined,
      text: text.length > 0 ? text : undefined,
      limit,
    };
  }

  private normalizeKeywords(keywords: string[]): string[] {
    const normalized = keywords
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword.length > 0);
    return Array.from(new Set(normalized));
  }
}
