export type CardCategory = 'EN to NL' | 'Question NL' | 'Dev';

export interface GroupType {
  id: string;
  cardIds: string[];
  name: string;
  /** @deprecated Use settings for default group now */
  isDefault?: boolean;
}

export interface SettingsType {
  id: string;
  defaultGroupId?: string;
}

export interface CardType {
  id: string;
  sides: string[];
  dueAt?: number | null;
  rate?: number | null;
  category?: CardCategory;
}

export interface SentenceType {
  id: string;
  original: string;
  translation: string;
  rate: number | null;
  dueAt: number | null;
}
