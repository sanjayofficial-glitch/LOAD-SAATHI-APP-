// Reusable dark-mode-aware chart styling constants
// Uses CSS custom properties from globals.css so colors adapt to light/dark mode

export const chartTickStyle = {
  fill: 'hsl(var(--muted-foreground))',
  fontSize: 12,
};

export const chartTooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 12,
  fontSize: 12,
};

export const chartGridClass = 'stroke-muted';
