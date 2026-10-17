/**
 * KeyTakeaways — AEO-optimized bullet list.
 *
 * Renders 3–5 concise takeaways immediately after the DirectAnswer.
 * Designed for featured snippets and AI answer systems.
 * Must contain only verified, non-promotional content.
 */

interface KeyTakeawaysProps {
  /** 3–5 concise bullet points */
  items: string[];
  /** Optional heading (default: "Key Takeaways") */
  heading?: string;
}

export default function KeyTakeaways({ items, heading = "Key Takeaways" }: KeyTakeawaysProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="key-takeaways bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
      <h2 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-3">{heading}</h2>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm sm:text-base text-gray-800 dark:text-gray-200 leading-relaxed">
            <span className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
