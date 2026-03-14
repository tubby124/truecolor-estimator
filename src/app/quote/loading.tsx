import { Skeleton } from "@/components/ui";

export default function QuoteLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-80 mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-40 mt-4 rounded-md" />
        </div>
      </div>
    </div>
  );
}
