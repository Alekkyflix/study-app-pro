// useLectures hook for data fetching
import { useState, useEffect } from "react";
import { apiClient } from "../services/api";

export function useLectures() {
  const [lectures, setLectures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getLectures()
      .then(setLectures)
      .finally(() => setLoading(false));
  }, []);

  return { lectures, loading };
}
