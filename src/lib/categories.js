import {
  BankIcon,
  BookOpenTextIcon,
  CarIcon,
  ChatCircleTextIcon,
  CpuIcon,
  DevicesIcon,
  FilmSlateIcon,
  GameControllerIcon,
  GlobeHemisphereWestIcon,
  LeafIcon,
  LightbulbIcon,
  LightningIcon,
  MaskHappyIcon,
  MathOperationsIcon,
  MusicNotesIcon,
  PaletteIcon,
  PawPrintIcon,
  PuzzlePieceIcon,
  ScrollIcon,
  ShuffleIcon,
  SmileyIcon,
  SoccerBallIcon,
  SparkleIcon,
  StarIcon,
  TelevisionIcon,
} from '@phosphor-icons/react';
import { splitCategory } from './quiz.js';

// Flat printed colours, one per topic. Read them as a CSS colour with
// flat(tone); the text on them is always --color-on-flat.
export const flat = (tone) => `var(--color-${tone})`;

// Labels stay short (one word where possible) so they never overflow a tile.
const META = {
  9: { icon: LightbulbIcon, tone: 'yellow', group: 'World', label: 'General' },
  10: {
    icon: BookOpenTextIcon,
    tone: 'orange',
    group: 'Entertainment',
    label: 'Books',
  },
  11: {
    icon: FilmSlateIcon,
    tone: 'pink',
    group: 'Entertainment',
    label: 'Film',
  },
  12: {
    icon: MusicNotesIcon,
    tone: 'blue',
    group: 'Entertainment',
    label: 'Music',
  },
  13: {
    icon: MaskHappyIcon,
    tone: 'orange',
    group: 'Entertainment',
    label: 'Theatre',
  },
  14: {
    icon: TelevisionIcon,
    tone: 'green',
    group: 'Entertainment',
    label: 'TV',
  },
  15: {
    icon: GameControllerIcon,
    tone: 'pink',
    group: 'Entertainment',
    label: 'Gaming',
  },
  16: {
    icon: PuzzlePieceIcon,
    tone: 'yellow',
    group: 'Entertainment',
    label: 'Tabletop',
  },
  17: { icon: LeafIcon, tone: 'green', group: 'Science', label: 'Nature' },
  18: { icon: CpuIcon, tone: 'blue', group: 'Science', label: 'Computers' },
  19: {
    icon: MathOperationsIcon,
    tone: 'yellow',
    group: 'Science',
    label: 'Maths',
  },
  20: { icon: LightningIcon, tone: 'pink', group: 'World', label: 'Mythology' },
  21: { icon: SoccerBallIcon, tone: 'green', group: 'World', label: 'Sports' },
  22: {
    icon: GlobeHemisphereWestIcon,
    tone: 'blue',
    group: 'World',
    label: 'Geography',
  },
  23: { icon: ScrollIcon, tone: 'orange', group: 'World', label: 'History' },
  24: { icon: BankIcon, tone: 'blue', group: 'World', label: 'Politics' },
  25: { icon: PaletteIcon, tone: 'orange', group: 'World', label: 'Art' },
  26: { icon: StarIcon, tone: 'yellow', group: 'World', label: 'Celebrities' },
  27: {
    icon: PawPrintIcon,
    tone: 'orange',
    group: 'Science',
    label: 'Animals',
  },
  28: { icon: CarIcon, tone: 'pink', group: 'World', label: 'Vehicles' },
  29: {
    icon: ChatCircleTextIcon,
    tone: 'yellow',
    group: 'Entertainment',
    label: 'Comics',
  },
  30: { icon: DevicesIcon, tone: 'pink', group: 'Science', label: 'Gadgets' },
  31: {
    icon: SparkleIcon,
    tone: 'pink',
    group: 'Entertainment',
    label: 'Anime',
  },
  32: {
    icon: SmileyIcon,
    tone: 'yellow',
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
  icon: ShuffleIcon,
  tone: 'yellow',
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
    icon: meta.icon ?? LightbulbIcon,
    tone: meta.tone ?? 'blue',
  };
}

const ID_BY_NAME = new Map(FALLBACK.map((c) => [c.name, c.id]));

export function categoryLabel(name) {
  return META[ID_BY_NAME.get(name)]?.label ?? splitCategory(name).label;
}

export function topicLabel(categories, id) {
  if (!id) return 'Anything goes';
  return categories.find((c) => c.id === String(id))?.label ?? 'Trivia';
}

export function categoryTone(name) {
  return META[ID_BY_NAME.get(name)]?.tone ?? 'blue';
}
