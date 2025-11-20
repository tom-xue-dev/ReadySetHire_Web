import { SparklesIcon } from '@heroicons/react/24/outline';

function bandColor(score: number) {
  if (score >= 85) return { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-200' };
  if (score >= 70) return { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-200' };
  return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-200' };
}

export function ScoreBadge({ score }: { score: number }) {
  const c = bandColor(score);
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${c.bg} ${c.text} ring-1 ${c.ring}`}>
      <SparklesIcon className="w-3.5 h-3.5" />
      <span>{score}% match</span>
    </div>
  );
}


