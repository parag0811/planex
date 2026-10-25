export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-canvas">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-brand/20 border-t-brand"
        aria-label="Loading"
      />
    </div>
  );
}
