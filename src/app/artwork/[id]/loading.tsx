export default function Loading() {
  return (
    <div className="container py-8 space-y-6 animate-fade-in">
      <div className="h-4 w-24 skeleton rounded-xs" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 aspect-square skeleton rounded-xs" />
        <div className="lg:col-span-5 space-y-4">
          <div className="h-8 w-48 skeleton rounded-xs" />
          <div className="h-16 w-full skeleton rounded-xs" />
          <div className="h-48 w-full skeleton rounded-xs" />
        </div>
      </div>
    </div>
  )
}
