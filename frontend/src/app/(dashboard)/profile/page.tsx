export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#11151f] px-6 pt-24 text-white">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#101722] p-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#f97316]/70">
          Profile
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#a89880]">
          This area is ready for account details, avatar updates, and user preferences.
        </p>
      </div>
    </main>
  );
}
