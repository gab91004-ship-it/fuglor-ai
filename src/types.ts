export type Role = 'user' | 'assistant';

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  timestamp: number;
  sources?: GroundingSource[];
  isStreaming?: boolean;
  error?: string;
  images?: Array<{ data: string; mimeType: string }>;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model: string;
  systemInstruction?: string;
  useSearch?: boolean;
  isPinned?: boolean;
}

export interface FuglorModel {
  id: string;
  name: string;
  geminiModel: string;
  badge: string;
  description: string;
  allowsGrounding: boolean;
  tagline: string;
}

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
  avatarBg: string;
  specialty: string;
  contributions: string[];
}
