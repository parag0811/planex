"use client";

type FullPageLoaderProps = {
  title?: string;
  subtitle?: string;
};

export default function FullPageLoader({
  title = "Initializing Workspace",
  subtitle = "Preparing your dashboard...",
}: FullPageLoaderProps) {
  return (
    <div 
      className="flex flex-1 w-full h-full min-h-[50vh] items-center justify-center px-6"
      style={{ backgroundColor: "#141414" }}
    >
      <div 
        className="w-full max-w-md border p-8 text-center"
        style={{ 
          borderColor: "#2b2321", 
          backgroundColor: "#101010",
        }}
      >
        <div 
          className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-t-[#d84c28]"
          style={{ borderColor: "rgba(216, 76, 40, 0.2)", borderTopColor: "#d84c28" }}
        />
        <p 
          className="text-[11px] font-bold tracking-[0.2em] uppercase"
          style={{ 
            fontFamily: '"JetBrains Mono", "Fira Code", monospace', 
            color: "#d84c28" 
          }}
        >
          {title}
        </p>
        <p 
          className="mt-3 text-[13px]"
          style={{ 
            fontFamily: '"Inter", system-ui, sans-serif',
            color: "#a6786d" 
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  );
}