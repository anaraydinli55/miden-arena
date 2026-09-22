import { PredictionPanel } from '@/components/arena/prediction-panel';

export const metadata = {
  title: 'Miden Arena | ZK Prediction Hub',
  description: 'Zero-Knowledge prediction markets on Polygon Miden Testnet',
};

export default function ArenaPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Arena Prediction Hub</h1>
        <p className="text-gray-400 text-sm mt-1">
          Predict on-chain with Bread Wallet ZK STARK proofs and earn ANR rewards
        </p>
      </div>

      <PredictionPanel />
    </div>
  );
}
