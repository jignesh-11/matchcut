import { AILength, AIMode, AITone } from '../../types/ai';

export interface CreativePreset {
  id: string;
  label: string;
  icon: string;
  prompt: string;
  tone: AITone;
  customTone?: string;
  length: AILength;
  mode: AIMode;
  description: string;
}

export const CREATIVE_PRESETS: CreativePreset[] = [
  {
    id: 'solo-developer',
    label: 'Solo Developer',
    icon: '💻',
    prompt: 'A solitary developer working late into the night, solving hard technical problems in silence before unveiling something transformative.',
    tone: 'cinematic',
    length: 'short',
    mode: 'script',
    description: 'Quiet grind, technical resilience, and building in the dark.'
  },
  {
    id: 'dark-cinematic',
    label: 'Dark Cinematic',
    icon: '🎬',
    prompt: 'An intense, ominous atmosphere of shadows, high-stakes reckoning, and cold inevitability.',
    tone: 'dark',
    length: 'short',
    mode: 'sentences',
    description: 'Moody, shadowy, dramatic statements with high visual gravity.'
  },
  {
    id: 'hard-choices',
    label: 'Hard Choices',
    icon: '⚖️',
    prompt: 'Choosing painful discipline over momentary comfort to claim long-term freedom and self-mastery.',
    tone: 'bold',
    length: 'short',
    mode: 'sentences',
    description: 'Striking truths about sacrifice, discipline, and uncompromising focus.'
  },
  {
    id: 'silent-grind',
    label: 'Silent Grind',
    icon: '⚡',
    prompt: 'Working without an audience, staying humble through repeated failure, and letting results speak when the curtain lifts.',
    tone: 'motivational',
    length: 'short',
    mode: 'script',
    description: 'Unseen work, patience, and breakthrough execution.'
  },
  {
    id: 'comeback-story',
    label: 'Comeback Story',
    icon: '🔥',
    prompt: 'Hitting rock bottom, being counted out by everyone, and rising back with unstoppable conviction.',
    tone: 'dramatic',
    length: 'medium',
    mode: 'script',
    description: 'Triumph over adversity, redemption, and defiant comeback.'
  },
  {
    id: 'one-sided-love',
    label: 'One-Sided Love',
    icon: '💔',
    prompt: 'The quiet ache of loving someone who cannot see you, unread messages, and silent memories in an empty room.',
    tone: 'emotional',
    length: 'medium',
    mode: 'sentences',
    description: 'Poetic, melancholic reflections on unreciprocated devotion.'
  },
  {
    id: 'late-night-thoughts',
    label: 'Late Night Thoughts',
    icon: '🌙',
    prompt: 'Raw 3 AM contemplation about who we really are when the noise of the world stops.',
    tone: 'emotional',
    length: 'short',
    mode: 'sentences',
    description: 'Vulnerable, contemplative observations on life and time.'
  },
  {
    id: 'product-launch',
    label: 'Product Launch',
    icon: '🚀',
    prompt: 'The final countdown after months of building alone, flipping the switch, and sharing your vision with the world.',
    tone: 'inspirational',
    length: 'short',
    mode: 'script',
    description: 'High energy, anticipation, and release day momentum.'
  },
  {
    id: 'ai-revolution',
    label: 'AI Revolution',
    icon: '🤖',
    prompt: 'Humans directing neural networks and autonomous code to synthesize new realities at the speed of thought.',
    tone: 'cinematic',
    length: 'short',
    mode: 'sentences',
    description: 'Futuristic, cybernetic, and high-velocity innovation.'
  },
  {
    id: 'unstoppable',
    label: 'Unstoppable',
    icon: '💎',
    prompt: 'An absolute refusal to yield, breaking through resistance, and demanding victory against all odds.',
    tone: 'bold',
    length: 'ultra-short',
    mode: 'sentences',
    description: 'Raw power, ultra-short punchy words, and relentless drive.'
  },
  {
    id: 'minimal-aesthetic',
    label: 'Minimal Aesthetic',
    icon: '⚪',
    prompt: 'Essential, stripped-down thoughts on clarity, silence, and having nothing left to take away.',
    tone: 'minimal',
    length: 'ultra-short',
    mode: 'sentences',
    description: 'Clean, elegant, stark typography with zero excess.'
  },
  {
    id: 'unexpected-comedy',
    label: 'Unexpected Comedy',
    icon: '🎭',
    prompt: 'A dry, sarcastic take on modern corporate life, endless meetings, and pretending we know what we are doing.',
    tone: 'funny',
    length: 'short',
    mode: 'sentences',
    description: 'Witty, relatable, and self-deprecating humor.'
  },
];
