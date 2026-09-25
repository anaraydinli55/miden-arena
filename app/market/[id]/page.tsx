import { PredictionPanel } from "@/components/arena/prediction-panel";

export default function MarketDetailPage() {
  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-4">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-400">
              PROTOCOL PREDICTION
            </span>
            <h1 className="text-2xl font-bold text-white">
              Will Miden mainnet launch before Q2 2027?
            </h1>
            <p className="text-xs text-white/50">
              Prediction market on Miden Testnet with ZK STARK rollups and private notes.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <PredictionPanel />
        </div>
      </div>
    </div>
  );
}
