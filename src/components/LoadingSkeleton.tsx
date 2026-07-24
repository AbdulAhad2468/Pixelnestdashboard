export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-blue-500/20 rounded w-3/4"></div>
      <div className="h-4 bg-blue-500/20 rounded w-1/2"></div>
      <div className="h-4 bg-blue-500/20 rounded w-5/6"></div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-black/30 border border-blue-500/30 rounded-lg p-4 animate-pulse">
      <div className="h-6 bg-blue-500/20 rounded w-1/3 mb-3"></div>
      <div className="h-4 bg-blue-500/20 rounded w-full mb-2"></div>
      <div className="h-4 bg-blue-500/20 rounded w-2/3"></div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-xl p-6 min-h-[500px] border border-blue-500/30 shadow-lg w-80 flex-shrink-0 flex flex-col animate-pulse">
      <div className="h-8 bg-blue-500/20 rounded w-1/2 mb-5"></div>
      <div className="space-y-4 flex-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-blue-500/20 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}
