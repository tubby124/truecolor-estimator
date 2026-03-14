import { Skeleton, SkeletonPrice } from "@/components/ui";

export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-5 w-40 mt-4 mb-2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-36 mb-2" />
            <SkeletonPrice />
            <Skeleton className="h-px w-full my-4" />
            <SkeletonPrice />
            <Skeleton className="h-12 w-full mt-6 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
