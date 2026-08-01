import { AgentCard } from "./AgentCard";

interface AgentAnalysisGridProps {
  macro: string | undefined;
  technical: string | undefined;
  sentiment: string | undefined;
}

export function AgentAnalysisGrid({
  macro,
  technical,
  sentiment,
}: AgentAnalysisGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <AgentCard title="Macro" icon="🌍" content={macro} />
      <AgentCard title="Technical" icon="📈" content={technical} />
      <AgentCard title="Sentiment" icon="📰" content={sentiment} />
    </div>
  );
}
