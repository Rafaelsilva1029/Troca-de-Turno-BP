export default function Loading() {
  return (
    <div className="space-y-6 p-6">
      <div className="border-l-4 border-green-500 pl-4">
        <div className="h-8 bg-slate-700 rounded w-64 animate-pulse"></div>
        <div className="h-4 bg-slate-700 rounded w-96 mt-2 animate-pulse"></div>
      </div>
      <div className="bg-slate-800 p-4 rounded-lg">
        <div className="h-10 bg-slate-700 rounded animate-pulse"></div>
      </div>
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    </div>
  )
}
