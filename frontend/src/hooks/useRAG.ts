// useRAG hook for chat functionality
import { useState } from "react";
import { apiClient } from "../services/api";

export function useRAG(lectureId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (query: string) => {
    setLoading(true);
    try {
      const response = await apiClient.sendChatMessage(lectureId, query);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: query },
        { role: "assistant", content: response.response }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, sendMessage, loading };
}
