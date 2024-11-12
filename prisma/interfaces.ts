// This file was auto-generated by prisma-generator-typescript-interfaces

export interface Article {
  id: number;
  title: string;
  publishedAt: Date;
  summary: string | null;
  link: string | null;
  topics?: Topic[];
  states?: State[];
  authorId: number | null;
  author?: User | null;
  authorName: string | null;
  views: number;
  image: string | null;
  slug: string;
  source: string | null;
}

export interface State {
  id: number;
  name: string;
  code: string;
  articles?: Article[];
  userPreferences?: UserPreferences[];
}

export interface Topic {
  id: number;
  name: string;
  articles?: Article[];
  userPreferences?: UserPreferences[];
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  preferences?: UserPreferences | null;
  articles?: Article[];
}

export interface UserPreferences {
  id: number;
  userId: number;
  savedStates?: State[];
  savedTopics?: Topic[];
  user?: User;
}

export interface JobState {
  id: number;
  name: string;
  lastPublishedAt: Date | null;
  page: number | null;
  pageSize: number | null;
  interval: string;
  isActive: boolean;
  updatedAt: Date;
}