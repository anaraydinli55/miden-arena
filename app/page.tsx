import Link from "next/link";
import { ArrowUpRight, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";

export default function Home() {
  return <div className="grid-bg min-h-screen">
    <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-20">
      <div className="max-w-4xl">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-1.5 text-xs text-white/55"><Sparkles size={13}/> Miden-powered prediction arena</div>
        <h1 className="text-6xl font-black tracking-[-.055em] sm:text-8xl">PREDICT<br/><span className="text-white/35">PRIVATELY.</span><br/>PROVE <span className="italic">PUBLICLY.</span></h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-white/50">A prediction market interface built around private positions, reputation, and verifiable outcomes.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Link href="/arena" className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-black">Enter Arena <ArrowUpRight className="ml-1 inline" size={16}/></Link><Link href="/markets" className="rounded-xl border border-white/10 bg-white/[.03] px-5 py-3 text-sm font-semibold">Explore Markets</Link></div>
        <div className="mt-16 grid max-w-2xl grid-cols-3 gap-3">
          {[[LockKeyhole,"Private Positions"],[ShieldCheck,"Verifiable Results"],[Sparkles,"Onchain Reputation"]].map(([I,t]) => <div key={String(t)} className="card rounded-2xl p-4"><I size={17}/><div className="mt-3 text-xs text-white/50">{String(t)}</div></div>)}
        </div>
      </div>
    </section>
  </div>
}
