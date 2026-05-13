export default function SessoesLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="flex justify-between">
        <div className="h-8 w-28 bg-gray-200 rounded-lg" />
        <div className="h-9 w-28 bg-gray-200 rounded-xl" />
      </div>
      <div className="h-10 bg-gray-200 rounded-xl" />
      <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-12 space-y-1 text-center">
              <div className="h-3 w-8 bg-gray-200 rounded mx-auto" />
              <div className="h-6 w-6 bg-gray-200 rounded mx-auto" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
