import { Panel } from "@/components/ui/panel";

export function ResultsSkeleton() {
  return (
    <div className="grid gap-6">
      <Panel className="rounded-[32px] px-6 py-6 sm:px-8">
        <div className="shimmer h-6 w-28 rounded-full" />
        <div className="shimmer mt-5 h-10 w-2/3 rounded-2xl" />
        <div className="shimmer mt-4 h-5 w-full rounded-full" />
        <div className="shimmer mt-2 h-5 w-4/5 rounded-full" />
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Panel key={index} className="rounded-[28px] p-5">
            <div className="shimmer h-4 w-20 rounded-full" />
            <div className="shimmer mt-4 h-9 w-24 rounded-2xl" />
            <div className="shimmer mt-3 h-4 w-full rounded-full" />
          </Panel>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
        <Panel className="rounded-[32px] p-6 sm:p-8">
          <div className="shimmer h-5 w-24 rounded-full" />
          <div className="shimmer mt-5 h-8 w-60 rounded-2xl" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="shimmer h-4 w-40 rounded-full" />
                <div className="shimmer h-3 w-full rounded-full" />
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="rounded-[32px] p-6 sm:p-8">
          <div className="shimmer h-5 w-24 rounded-full" />
          <div className="shimmer mt-5 h-8 w-52 rounded-2xl" />
          <div className="mt-8 space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-[24px] border border-black/6 p-4">
                <div className="shimmer h-4 w-28 rounded-full" />
                <div className="shimmer mt-3 h-3 w-full rounded-full" />
                <div className="shimmer mt-2 h-3 w-5/6 rounded-full" />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel className="rounded-[32px] p-6 sm:p-8">
        <div className="grid gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="shimmer h-4 w-20 rounded-full" />
              <div className="shimmer h-12 w-full rounded-2xl" />
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="rounded-[32px] p-6 sm:p-8">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="grid gap-4 md:grid-cols-[140px_1fr_120px]">
              <div className="shimmer h-20 rounded-[18px]" />
              <div className="space-y-2">
                <div className="shimmer h-4 w-3/4 rounded-full" />
                <div className="shimmer h-4 w-full rounded-full" />
                <div className="shimmer h-4 w-1/2 rounded-full" />
              </div>
              <div className="shimmer h-8 rounded-full" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
