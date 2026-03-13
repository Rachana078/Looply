export const TEAM_COLORS = {
  blue:   { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  green:  { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  red:    { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  pink:   { bg: 'bg-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-500' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500' },
} as const;

export type TeamColor = keyof typeof TEAM_COLORS;
export const TEAM_COLOR_OPTIONS = Object.keys(TEAM_COLORS) as TeamColor[];

export function teamBadgeClasses(color: string) {
  const c = TEAM_COLORS[color as TeamColor] ?? TEAM_COLORS.blue;
  return `${c.bg} ${c.text}`;
}

export function teamDotClass(color: string) {
  return TEAM_COLORS[color as TeamColor]?.dot ?? TEAM_COLORS.blue.dot;
}
