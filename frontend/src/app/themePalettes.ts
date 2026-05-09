export type ThemeId =
  | 'blue'
  | 'green'
  | 'pink'
  | 'brown'
  | 'black'
  | 'gray'
  | 'sunset'
  | 'sun'
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
    label: 'Midnight Ocean',
    description: 'Deep-water ink blues—moonlit frost text and muted teal shimmer.',
    swatch: '#271b6d',
    vars: {
      '--theme-bg': '#0A121F',
      '--theme-panel': '#0F1B2E',
      '--theme-surface': '#16263C',
      '--theme-border': '#2A4259',
      '--theme-text': '#DCE9F3',
      '--theme-muted': '#7FA3BC',
      '--theme-accent': '#4BC4D4',
      '--theme-accent-strong': '#271b6d',
    },
  },
  {
    id: 'green',
    label: 'Green Balance',
    description:
      'Dew-washed meadow greens—fresh growth panels and lively leaf accents.',
    swatch: '#22C87A',
    vars: {
      '--theme-bg': '#EAF8F1',
      '--theme-panel': '#D8F0E5',
      '--theme-surface': '#F6FEF9',
      '--theme-border': '#9DD9B8',
      '--theme-text': '#123B2A',
      '--theme-muted': '#2F7A54',
      '--theme-accent': '#22C87A',
      '--theme-accent-strong': '#16965B',
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
    description:
      'Charcoal and graphite dark mode with calm moonlit silver accents.',
    swatch: '#121214',
    vars: {
      '--theme-bg': '#121214',
      '--theme-panel': '#1C1C1F',
      '--theme-surface': '#26262A',
      '--theme-border': '#3F3F46',
      '--theme-text': '#ECECEF',
      '--theme-muted': '#A1A1AA',
      '--theme-accent': '#9CA8B8',
      '--theme-accent-strong': '#7C8EA3',
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
    id: 'sun',
    label: 'Sunrise',
    description: 'Sky blue to warm peach, gold and sun-orange accents.',
    swatch: '#F59E0B',
    vars: {
      '--theme-bg': '#F5FAFF',
      '--theme-panel': '#FFF3E0',
      '--theme-surface': '#FFFCF7',
      '--theme-border': '#F5D5A8',
      '--theme-text': '#5C3D2E',
      '--theme-muted': '#8B6544',
      '--theme-accent': '#F59E0B',
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
    label: 'Deep Grove',
    description:
      'Living canopy dusk—jewel-toned emerald depth with bright mint-firefly accents.',
    swatch: '#3FE699',
    vars: {
      '--theme-bg': '#183229',
      '--theme-panel': '#1F3E34',
      '--theme-surface': '#294C40',
      '--theme-border': '#3D7A62',
      '--theme-text': '#E9FFF4',
      '--theme-muted': '#8FE2BA',
      '--theme-accent': '#3FE699',
      '--theme-accent-strong': '#1DD68A',
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
