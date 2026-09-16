"use client";
"use client";
import { MarketCard } from "@/components/arena/market-card";
const markets = [
  ["miden-mainnet","Will Miden mainnet launch before Q2 2027?","Protocol",68,"12.4K SKS","18d"],
  ["btc-150k","Will BTC reach $150k in 2027?","Crypto",54,"31.8K SKS","102d"],
  ["eth-10k","Will ETH reach $10,000 this cycle?","Crypto",47,"22.1K SKS","76d"],
  ["miden-tps","Will Miden exceed 100k TPS on mainnet?","Tech",72,"8.7K SKS","41d"],
];
export default function Arena(){return <div className="mx-auto max-w-7xl px-6 py-10"><header className="mb-8"><div className="text-xs uppercase tracking-[.25em] text-white/35">Live Markets</div><h1 className="mt-2 text-4xl font-bold tracking-tight">Prediction Arena</h1><p className="mt-2 text-sm text-white/40">Choose a market. Make a private prediction. Build public reputation.</p></header><div className="grid gap-4 md:grid-cols-2">{markets.map(m=><MarketCard key={m[0] as string} id={m[0] as string} title={m[1] as string} category={m[2] as string} yes={m[3] as number} volume={m[4] as string} time={m[5] as string}/>)}</div></div>}
