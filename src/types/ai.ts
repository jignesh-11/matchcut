export type AITone =
  | 'cinematic'
  | 'motivational'
  | 'dark'
  | 'emotional'
  | 'minimal'
  | 'dramatic'
  | 'bold'
  | 'romantic'
  | 'funny'
  | 'inspirational'
  | 'custom';

export type AILength = 'ultra-short' | 'short' | 'medium';

export type AIMode = 'sentences' | 'script';

export interface AIGenerationOptions {
  prompt: string;
  tone?: AITone;
  customTone?: string;
  length?: AILength;
  count?: number; // 5, 8, 10
  mode?: AIMode;
}

export interface AIGeneratedSentence {
  id: string;
  text: string;
  tone: string;
  suggestedAnchor: string;
}

export interface AIGenerationResponse {
  success: boolean;
  results: AIGeneratedSentence[];
  count: number;
  error?: string;
  provider?: string;
}
