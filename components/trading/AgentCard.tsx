interface AgentCardProps {
  title: string;
  icon: string;
  content: string | undefined;
}

export function AgentCard({ title, icon, content }: AgentCardProps) {
  return (
    <div className="bg-gray-900 p-4 rounded-xl">
      <h3 className="mb-2">{icon} {title}</h3>
      <pre className="text-xs whitespace-pre-wrap">
        {content ?? "Loading..."}
      </pre>
    </div>
  );
}
