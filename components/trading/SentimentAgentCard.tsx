import type {NewsSentimentResponse} from "@/lib/sentiment/types";

interface SentimentAgentCardProps {
  title: string;
  icon: string;
  content: NewsSentimentResponse | null;
}

export function SentimentAgentCard({ title, icon, content }: SentimentAgentCardProps) {
  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <h3 className="mb-2">{icon} {title}</h3>
      <pre className="text-xs whitespace-pre-wrap">
        {content?.confidence ?? "Loading..."}
      </pre>
    </div>
  );
}
