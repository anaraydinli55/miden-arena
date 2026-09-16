import { PredictionPanel } from "@/components/arena/prediction-panel";

export default async function Market({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="text-xs uppercase tracking-[.25em] text-white/35">
        Market / {id}
      </div>
      <div className="mt-3 grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="card rounded-2xl p-6">
          <div className="flex justify-between">
            <div>
              <span className="text-xs text-white/40">PROTOCOL</span>
              <h1 className="mt-2 text-3xl font-bold">
                Will Miden mainnet launch before Q2 2027?
              </h1>
            </div>
            <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">
              OPEN
            </div>
          </div>

          <div className="mt-10 flex h-72 items-end gap-1 border-b border-white/10 p-4">
            {[42, 46, 44, 49, 53, 50, 56, 55, 61, 64, 62, 68, 66, 68, 72, 69, 68].map(
              (h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-white/60"
                  style={{ height: `${h}%` }}
                />
              )
            )}
          </div>

          <div className="mt-5 flex justify-between text-xs text-white/35">
            <span>Probability history</span>
            <span>YES 68% · NO 32%</span>
          </div>
        </div>

        <PredictionPanel />
      </div>
    </div>
  );
}
