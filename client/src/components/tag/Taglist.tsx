

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs ring-1 ring-gray-200 bg-gray-100 text-gray-700">
      {children}
    </span>
  );
}
export function TagList({ tags }: { tags: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((t) => (
        <Chip key={t}>{t}</Chip>
      ))}
    </div>
  );
}