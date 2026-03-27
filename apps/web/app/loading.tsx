export default function Loading() {
  return (
    <main className='mx-auto grid min-h-screen w-full max-w-[980px] place-items-center px-4 py-10'>
      <div className='w-full max-w-xl rounded-xl border border-(--border) bg-[linear-gradient(180deg,rgba(19,29,49,0.95),rgba(13,20,36,0.92))] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)]'>
        <div className='mb-5 flex items-center gap-3'>
          <span className='inline-block h-3 w-3 animate-pulse rounded-full bg-(--accent)' />
          <div className='text-sm font-semibold uppercase tracking-[0.08em] text-[#cfe2ff]'>
            Loading Investment Coach
          </div>
        </div>

        <div className='space-y-3'>
          <div className='h-4 w-2/3 animate-pulse rounded bg-[rgba(79,140,255,0.2)]' />
          <div className='h-4 w-full animate-pulse rounded bg-[rgba(79,140,255,0.14)]' />
          <div className='h-4 w-5/6 animate-pulse rounded bg-[rgba(79,140,255,0.14)]' />
        </div>
      </div>
    </main>
  );
}
