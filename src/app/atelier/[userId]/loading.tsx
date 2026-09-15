export default function Loading() {
  return (
    <div className="container py-8 space-y-6 animate-fade-in">
      <div className="h-28 w-full skeleton rounded-xs" />
      <div className="h-8 w-64 skeleton rounded-xs" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square skeleton rounded-xs" />
        ))}
      </div>
    </div>
  )
}
