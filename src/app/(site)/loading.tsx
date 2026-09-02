import { CardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="flex flex-col gap-10">
      <div className="img-skeleton aspect-[16/9] rounded-lg" aria-hidden />
      <CardGridSkeleton count={8} />
    </div>
  );
}
