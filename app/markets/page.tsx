"use client";
import { MarketCard } from "@/components/arena/market-card";
export default function Markets(){return <div className="mx-auto max-w-7xl px-6 py-10"><h1 className="text-4xl font-bold">Markets</h1><div className="mt-8 grid gap-4 md:grid-cols-2">{[
["a","Will stablecoin supply grow 2x?","Macro",61,"19.2K SKS","29d"],["b","Will privacy become a top 10 crypto narrative?","Crypto",76,"9.1K SKS","58d"],["c","Will a ZK rollup hit 1M daily users?","Tech",39,"14.5K SKS","91d"],["d","Will gold trade above $4,500?","Macro",58,"17.7K SKS","133d"]].map(m=><MarketCard key={m[0] as string} id={m[0] as string} title={m[1] as string} category={m[2] as string} yes={m[3] as number} volume={m[4] as string} time={m[5] as string}/>)}</div></div>}
