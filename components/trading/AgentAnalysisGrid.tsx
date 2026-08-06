import { AgentCard } from "./AgentCard";
import type {NewsSentimentResponse} from "@/lib/sentiment/types";
import { SentimentAgentCard } from "./SentimentAgentCard";

interface AgentAnalysisGridProps {
  macro: string | undefined;
  technical: string | undefined;
  sentiment: NewsSentimentResponse | null;
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
      <SentimentAgentCard title="Sentiment" icon="📰" content={sentiment} />
    </div>
  );
}
