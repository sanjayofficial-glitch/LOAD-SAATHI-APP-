export interface SearchFilters {
  origin?: string;
  destination?: string;
  weight?: number;
  date?: string;
}

function parseWithRegex(query: string): SearchFilters | null {
  const filters: SearchFilters = {};
  const q = query.toLowerCase().trim();

  // Extract weight: "5 tonnes", "5 ton", "5t", "5 tons"
  const weightMatch = q.match(/(\d+(?:\.\d+)?)\s*(?:tonne|ton|t)(?:s)?/i);
  if (weightMatch) {
    filters.weight = parseFloat(weightMatch[1] ?? '');
  }

  // Extract date mentions
  const today = new Date();
  if (/\b(now|today|immediately|asap)\b/i.test(q)) {
    filters.date = today.toISOString().split('T')[0];
  } else {
    const dateMatch = q.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (dateMatch) filters.date = dateMatch[1];
  }

  // Extract origin/destination using common patterns:
  // "from X to Y", "X to Y", "between X and Y"
  const fromToPatterns = [
    /(?:from|in)\s+([A-Za-z\s]+?)\s+(?:to|->|for|bound)\s+([A-Za-z\s]+?)(?:\s+(?:with|for|weight|tonne|ton|on|at|by)|$)/i,
    /^(?:send|ship|move|transport|carry|haul)\s+(?:.*?\s+)?(?:from|in)\s+([A-Za-z\s]+?)\s+(?:to|->)\s+([A-Za-z\s]+?)(?:\s|$)/i,
    /^(?:from|in)\s+([A-Za-z\s]+?)\s+(?:to|->)\s+([A-Za-z\s]+?)$/i,
  ];

  for (const pattern of fromToPatterns) {
    const match = q.match(pattern);
    if (match) {
      filters.origin = capitalize(match[1]);
      filters.destination = capitalize(match[2]);
      break;
    }
  }

  // Single city mention (if no origin/dest yet)
  if (!filters.origin && !filters.destination) {
    const cityMatch = q.match(/(?:to|in|at|near|for)\s+([A-Za-z\s]{3,}?)(?:\s+(?:with|for|weight|tonne|ton|on|at|by|$))/i);
    if (cityMatch) {
      filters.destination = capitalize(cityMatch[1]);
    }
  }

  return Object.keys(filters).length > 0 ? filters : null;
}

function capitalize(s: string | undefined): string {
  return (s ?? '').trim().replace(/\b\w/g, c => c.toUpperCase());
}

export const parseNaturalLanguageSearch = async (query: string): Promise<SearchFilters> => {
  // Fast path: try regex first
  const regexResult = parseWithRegex(query);
  if (regexResult) return regexResult;

  // Fallback: use secure Gemini proxy (Edge Function) for complex queries
  // API key is stored server-side, not exposed to the client
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  if (!SUPABASE_URL) return {};

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/gemini-proxy`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(10000), // 10s timeout
      }
    );

    if (!response.ok) return {};
    return await response.json();
  } catch {
    return {};
  }
};
