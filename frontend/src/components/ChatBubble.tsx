// Chat bubble component for RAG chat interface
export function ChatBubble({ 
  role, 
  message 
}: { 
  role: "user" | "assistant"; 
  message: string 
}) {
  return <div>ChatBubble - {role}: {message}</div>;
}
