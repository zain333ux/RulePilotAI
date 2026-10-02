import { PolicyRule } from "@/types/contracts";

interface PolicyCardProps {
  rule: PolicyRule;
}

export function PolicyCard({ rule }: PolicyCardProps) {
  return (
    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 transition-colors space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          {rule.id}
        </span>
        <span className="text-[11px] text-zinc-500 font-mono">
          Page {rule.citation.page} {rule.citation.section ? `· Sec ${rule.citation.section}` : ""}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-white">{rule.name}</h4>
        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
          {rule.citation.text}
        </p>
      </div>

      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
        <span className="text-zinc-500">Condition:</span>
        <code className="text-zinc-300 font-mono bg-zinc-800 px-1.5 py-0.5 rounded text-[11px]">
          {rule.field} {rule.operator} {String(rule.value)}
        </code>
      </div>
    </div>
  );
}
