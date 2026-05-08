export type ThemeId =
  | 'blue'
  | 'green'
  | 'pink'
  | 'brown'
  | 'black'
  | 'gray'
  | 'sunset'
  | 'ocean'
  | 'forest-night'
  | 'lavender-focus';

export interface ThemePalette {
  id: ThemeId;
  label: string;
  description: string;
  swatch: string;
  vars: Record<string, string>;
}

export const THEME_PALETTES: ThemePalette[] = [
  {
    id: 'blue',
    label: 'Blue Serenity',
    description: 'Softer blue tones with reduced glare.',
    swatch: '#4F83CC',
    vars: {
      '--theme-bg': '#F4F8FF',
      '--theme-panel': '#E5EEFF',
      '--theme-surface': '#FAFCFF',
      '--theme-border': '#C6D9FF',
      '--theme-text': '#1F3B6E',
      '--theme-muted': '#3E5F98',
      '--theme-accent': '#4F83CC',
      '--theme-accent-strong': '#3E6FB6',
    },
  },
  {
    id: 'green',
    label: 'Green Balance',
    description: 'Fresh and calm for long sessions.',
    swatch: '#7FB77E',
    vars: {
      '--theme-bg': '#F4F7F5',
      '--theme-panel': '#E3EFE6',
      '--theme-surface': '#F4F7F5',
      '--theme-border': '#BFD8B8',
      '--theme-text': '#2F3E34',
      '--theme-muted': '#4A6352',
      '--theme-accent': '#7FB77E',
      '--theme-accent-strong': '#5F9C5E',
    },
  },
  {
    id: 'pink',
    label: 'Pink Calm',
    description: 'Muted pink palette that is easier on the eyes.',
    swatch: '#C774A3',
    vars: {
      '--theme-bg': '#FFF6FA',
      '--theme-panel': '#F8E8F1',
      '--theme-surface': '#FFFBFD',
      '--theme-border': '#E7C8DA',
      '--theme-text': '#6A2E4F',
      '--theme-muted': '#87506D',
      '--theme-accent': '#C774A3',
      '--theme-accent-strong': '#A95D89',
    },
  },
  {
    id: 'brown',
    label: 'Brown Warm',
    description: 'Warm low-glare palette for comfort.',
    swatch: '#A16207',
    vars: {
      '--theme-bg': '#FAF5EF',
      '--theme-panel': '#F3E7D8',
      '--theme-surface': '#FFF9F1',
      '--theme-border': '#DFC5A5',
      '--theme-text': '#5A3A1F',
      '--theme-muted': '#7A5434',
      '--theme-accent': '#B7791F',
      '--theme-accent-strong': '#8B5E34',
    },
  },
  {
    id: 'black',
    label: 'Black Dark',
    description: 'Dark mode tuned for reduced eye strain.',
    swatch: '#111111',
    vars: {
      '--theme-bg': '#111111',
      '--theme-panel': '#1B1B1B',
      '--theme-surface': '#242424',
      '--theme-border': '#333333',
      '--theme-text': '#E5E5E5',
      '--theme-muted': '#B8B8B8',
      '--theme-accent': '#8B5CF6',
      '--theme-accent-strong': '#A78BFA',
    },
  },
  {
    id: 'gray',
    label: 'Gray Minimal',
    description: 'Neutral and low-distraction interface.',
    swatch: '#6B7280',
    vars: {
      '--theme-bg': '#F3F4F6',
      '--theme-panel': '#E5E7EB',
      '--theme-surface': '#F9FAFB',
      '--theme-border': '#D1D5DB',
      '--theme-text': '#1F2937',
      '--theme-muted': '#4B5563',
      '--theme-accent': '#6B7280',
      '--theme-accent-strong': '#374151',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset Pop',
    description: 'Warm coral and amber with vivid contrast.',
    swatch: '#FB7185',
    vars: {
      '--theme-bg': '#FFF7ED',
      '--theme-panel': '#FFE7D1',
      '--theme-surface': '#FFFDF8',
      '--theme-border': '#F7CFA4',
      '--theme-text': '#7C2D12',
      '--theme-muted': '#9A4A1B',
      '--theme-accent': '#FB7185',
      '--theme-accent-strong': '#EA580C',
    },
  },
  {
    id: 'ocean',
    label: 'Ocean Mist',
    description: 'Aqua and cyan tones for a fresh feel.',
    swatch: '#06B6D4',
    vars: {
      '--theme-bg': '#ECFEFF',
      '--theme-panel': '#CFFAFE',
      '--theme-surface': '#F5FEFF',
      '--theme-border': '#A5F3FC',
      '--theme-text': '#0F4C5C',
      '--theme-muted': '#256878',
      '--theme-accent': '#06B6D4',
      '--theme-accent-strong': '#0E7490',
    },
  },
  {
    id: 'forest-night',
    label: 'Forest Dusk',
    description: 'Dark green low-light theme with softer contrast.',
    swatch: '#2F6D52',
    vars: {
      '--theme-bg': '#101A15',
      '--theme-panel': '#18261F',
      '--theme-surface': '#213229',
      '--theme-border': '#2D473A',
      '--theme-text': '#D9EFE3',
      '--theme-muted': '#A9CCBB',
      '--theme-accent': '#46A57A',
      '--theme-accent-strong': '#5BC190',
    },
  },
  {
    id: 'lavender-focus',
    label: 'Lavender Focus',
    description: 'Soft violet tones for calm concentration.',
    swatch: '#8B5CF6',
    vars: {
      '--theme-bg': '#F6F3FF',
      '--theme-panel': '#EDE9FE',
      '--theme-surface': '#FBFAFF',
      '--theme-border': '#D8CCFF',
      '--theme-text': '#4C1D95',
      '--theme-muted': '#6B46C1',
      '--theme-accent': '#8B5CF6',
      '--theme-accent-strong': '#7C3AED',
    },
  },
];
