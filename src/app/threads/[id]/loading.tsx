export default function Loading() {
  return (
    <div className="container py-8 space-y-6 animate-fade-in">
      <div className="h-10 w-64 skeleton rounded-xs mb-2" />
      <div className="h-4 w-96 skeleton rounded-xs mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 h-[480px] skeleton rounded-xs" />
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-square skeleton rounded-xs" />
          ))}
        </div>
      </div>
    </div>
  )
}
