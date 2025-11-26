const DEFAULT_API_BASE_URL = 'http://localhost:8080';

const sanitizeBaseUrl = (url: string): string => {
  if (!url) {
    return DEFAULT_API_BASE_URL;
  }
  return url.replace(/\/+$/, '');
};

const readEnvBaseUrl = (): string | null => {
  try {
    const value = import.meta.env?.NG_APP_API_BASE_URL;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }
  } catch {
    // ignore unavailable env object
  }
  return null;
};

const readMetaBaseUrl = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const meta = document.querySelector('meta[name="app-api-base-url"]');
  const content = meta?.getAttribute('content')?.trim();
  return content && content.length > 0 ? content : null;
};

const detectedBaseUrl = readEnvBaseUrl() ?? readMetaBaseUrl() ?? DEFAULT_API_BASE_URL;

export const API_BASE_URL = sanitizeBaseUrl(detectedBaseUrl);

export const buildApiUrl = (path: string): string => {
  if (!path) {
    return API_BASE_URL;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
