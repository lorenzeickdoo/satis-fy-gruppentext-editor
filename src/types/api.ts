export interface Article {
  article: {
    name: string;
    category: string;
    count: number;
  };
}

export interface Group {
  group: {
    name: string;
    client_text: string;
    sort_order: number;
    id: number;
  };
  article: Article[];
}

export interface ApiResponse {
  data: {
    job_name: string;
    job_number: string;
    job_id: string;
    groups: Group[];
  };
}

export interface TextGroup {
  id: string;
  name: string;
  expanded: boolean;
  articlesExpanded: boolean;
  content: string;
  originalId: number;
  sortOrder: number;
  articles: Article[];
}

export interface AISettings {
  length: string;
  language: string;
  tone: string;
  style: string;
}