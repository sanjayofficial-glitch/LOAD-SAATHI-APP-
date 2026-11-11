import { useSimpleLabels } from '@/contexts/SimpleLabelsContext.hooks';

interface SimpleLabelProps {
  english: string;
  className?: string;
  hindiClassName?: string;
}

const SimpleLabel = ({ english, className, hindiClassName }: SimpleLabelProps) => {
  const labels = useSimpleLabels();
  const hindi = labels[english] || '';

  if (!hindi) {
    return <span className={className}>{english}</span>;
  }

  return (
    <span className={className}>
      {english}
      <span className={`block text-xs text-gray-500 dark:text-gray-400 font-normal ${hindiClassName || ''}`}>
        {hindi}
      </span>
    </span>
  );
};

export default SimpleLabel;
