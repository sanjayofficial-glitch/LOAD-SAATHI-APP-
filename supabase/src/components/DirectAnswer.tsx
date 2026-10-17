/**
 * DirectAnswer — AEO-optimized answer block.
 *
 * Renders a concise, visible HTML answer immediately after the H1.
 * Designed for featured snippets and AI answer systems.
 * Must contain only verified, non-promotional content.
 */

interface DirectAnswerProps {
  /** 40–70 word plain-language answer. No unsupported statistics or guarantees. */
  answer: string;
  /** Optional source/qualifier line (e.g., "Indicative rates, updated October 2026") */
  qualifier?: string;
}

export default function DirectAnswer({ answer, qualifier }: DirectAnswerProps) {
  return (
    <div className="direct-answer bg-orange-50 dark:bg-orange-950/30 border-l-4 border-orange-500 rounded-r-lg p-4 mb-6">
      <p className="text-base sm:text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
        <strong className="text-orange-700 dark:text-orange-400">Answer: </strong>
        {answer}
      </p>
      {qualifier && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          {qualifier}
        </p>
      )}
    </div>
  );
}
