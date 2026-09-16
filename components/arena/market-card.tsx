import Link from "next/link";

export function MarketCard({ id, title, category, yes, volume, time }: {id:string; title:string; category:string; yes:number; volume:string; time:string}) {
  return <Link href={`/market/${id}`} className="card group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-white/20">
    <div className="mb-5 flex items-center justify-between"><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/45">{category}</span><span className="text-xs text-white/35">{time}</span></div>
    <h3 className="min-h-14 text-lg font-semibold leading-snug">{title}</h3>
    <div className="mt-5 flex items-end justify-between"><div><div className="text-3xl font-bold">{yes}%</div><div className="text-xs text-white/35">YES probability</div></div><div className="text-right"><div className="text-sm font-medium">{volume}</div><div className="text-xs text-white/35">volume</div></div></div>
    <div className="mt-4 h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{width:`${yes}%`}} /></div>
  </Link>
}
