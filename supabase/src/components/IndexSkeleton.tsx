
import { Skeleton } from "@/components/ui/skeleton";
import LogoMark from "@/components/LogoMark";

const IndexSkeleton = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 w-full z-50 h-20 border-b border-border bg-background/70 dark:bg-[#050816]/70 backdrop-blur-xl">
        <div className="flex justify-between items-center w-full px-6 max-w-[1440px] mx-auto h-full">
          <div className="flex items-center gap-2">
            <LogoMark size="h-9 w-9 opacity-70" />
            <Skeleton className="h-6 w-28 rounded" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-20 rounded" />
            <Skeleton className="h-9 w-36 rounded" />
          </div>
        </div>
      </header>
      <div className="h-20" />
      <main>
        <section className="flex items-center min-h-[800px] py-20">
          <div className="max-w-[1440px] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <Skeleton className="h-6 w-64 rounded-full" />
              <Skeleton className="h-16 w-full max-w-xl rounded" />
              <Skeleton className="h-14 w-3/4 rounded" />
              <Skeleton className="h-6 w-full max-w-lg rounded" />
              <div className="flex gap-4">
                <Skeleton className="h-14 w-48 rounded" />
                <Skeleton className="h-14 w-36 rounded" />
              </div>
            </div>
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </section>
        <section className="py-8 border-y border-border">
          <div className="max-w-[1440px] mx-auto px-6 flex justify-around">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-32 rounded" />)}
          </div>
        </section>
        <section className="py-24">
          <div className="max-w-[1440px] mx-auto px-6">
            <Skeleton className="h-10 w-96 mb-4 rounded" />
            <Skeleton className="h-6 w-[600px] mb-16 rounded" />
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className={`h-48 rounded-xl ${i === 0 || i === 3 ? 'col-span-2' : ''}`} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border py-12">
        <div className="max-w-[1440px] mx-auto px-6 flex justify-between">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-6 w-48 rounded" />
        </div>
      </footer>
    </div>
  );
};

export default IndexSkeleton;
