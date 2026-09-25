import {
  Bank,
  BookOpenText,
  Car,
  ChatCircleText,
  Cpu,
  Devices,
  FilmSlate,
  GameController,
  GlobeHemisphereWest,
  Leaf,
  Lightbulb,
  Lightning,
  MaskHappy,
  MathOperations,
  MusicNotes,
  Palette,
  PawPrint,
  PuzzlePiece,
  Scroll,
  Shuffle,
  Smiley,
  SoccerBall,
  Sparkle,
  Star,
  Television,
} from '@phosphor-icons/react';
import { splitCategory } from './quiz.js';

export const TONE = {
  butter: 'bg-butter text-butter-ink',
  sky: 'bg-sky text-sky-ink',
  mint: 'bg-mint text-mint-ink',
  lilac: 'bg-lilac text-lilac-ink',
  peach: 'bg-peach text-peach-ink',
};

const META = {
  9: { icon: Lightbulb, tone: 'butter', group: 'World' },
  10: { icon: BookOpenText, tone: 'peach', group: 'Entertainment' },
  11: { icon: FilmSlate, tone: 'lilac', group: 'Entertainment' },
  12: { icon: MusicNotes, tone: 'sky', group: 'Entertainment' },
  13: {
    icon: MaskHappy,
    tone: 'peach',
    group: 'Entertainment',
    label: 'Theatre',
  },
  14: { icon: Television, tone: 'mint', group: 'Entertainment', label: 'TV' },
  15: { icon: GameController, tone: 'lilac', group: 'Entertainment' },
  16: { icon: PuzzlePiece, tone: 'butter', group: 'Entertainment' },
  17: { icon: Leaf, tone: 'mint', group: 'Science', label: 'Nature' },
  18: { icon: Cpu, tone: 'sky', group: 'Science' },
  19: {
    icon: MathOperations,
    tone: 'butter',
    group: 'Science',
    label: 'Maths',
  },
  20: { icon: Lightning, tone: 'lilac', group: 'World' },
  21: { icon: SoccerBall, tone: 'mint', group: 'World' },
  22: { icon: GlobeHemisphereWest, tone: 'sky', group: 'World' },
  23: { icon: Scroll, tone: 'peach', group: 'World' },
  24: { icon: Bank, tone: 'sky', group: 'World' },
  25: { icon: Palette, tone: 'peach', group: 'World' },
  26: { icon: Star, tone: 'butter', group: 'World' },
  27: { icon: PawPrint, tone: 'peach', group: 'Science' },
  28: { icon: Car, tone: 'lilac', group: 'World' },
  29: { icon: ChatCircleText, tone: 'butter', group: 'Entertainment' },
  30: { icon: Devices, tone: 'lilac', group: 'Science' },
  31: {
    icon: Sparkle,
    tone: 'lilac',
    group: 'Entertainment',
    label: 'Anime & Manga',
  },
  32: {
    icon: Smiley,
    tone: 'butter',
    group: 'Entertainment',
    label: 'Cartoons',
  },
};

export const GROUPS = ['World', 'Entertainment', 'Science'];

export const FALLBACK = [
  [9, 'General Knowledge'],
  [10, 'Entertainment: Books'],
  [11, 'Entertainment: Film'],
  [12, 'Entertainment: Music'],
  [13, 'Entertainment: Musicals & Theatres'],
  [14, 'Entertainment: Television'],
  [15, 'Entertainment: Video Games'],
  [16, 'Entertainment: Board Games'],
  [17, 'Science & Nature'],
  [18, 'Science: Computers'],
  [19, 'Science: Mathematics'],
  [20, 'Mythology'],
  [21, 'Sports'],
  [22, 'Geography'],
  [23, 'History'],
  [24, 'Politics'],
  [25, 'Art'],
  [26, 'Celebrities'],
  [27, 'Animals'],
  [28, 'Vehicles'],
  [29, 'Entertainment: Comics'],
  [30, 'Science: Gadgets'],
  [31, 'Entertainment: Japanese Anime & Manga'],
  [32, 'Entertainment: Cartoon & Animations'],
].map(([id, name]) => ({ id, name }));

export const ANY = {
  id: '',
  label: 'Anything goes',
  icon: Shuffle,
  tone: 'butter',
  group: null,
};

export function describe({ id, name }) {
  const meta = META[id] ?? {};
  const split = splitCategory(name);
  return {
    id: String(id),
    name,
    label: meta.label ?? split.label,
    group: meta.group ?? split.group ?? 'World',
    icon: meta.icon ?? Lightbulb,
    tone: meta.tone ?? 'sky',
  };
}

export function topicLabel(categories, id) {
  if (!id) return 'Anything';
  return categories.find((c) => c.id === String(id))?.label ?? 'Trivia';
}
