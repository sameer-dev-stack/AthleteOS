"use client";

import { useState, useCallback, useRef } from "react";

type StreamState = {
  text: string;
  isStreaming: boolean;
  error: string | null;
};

export function useStream() {
  const [state, setState] = useState<StreamState>({
    text: "",
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (
    streamFn: () => Promise<ReadableStream<string>>
  ) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const abort = abortRef.current;

    setState({ text: "", isStreaming: true, error: null });

    try {
      const stream = await streamFn();
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        if (abort.signal.aborted) break;
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += value;
        setState({ text: accumulated, isStreaming: true, error: null });
      }

      setState({ text: accumulated, isStreaming: false, error: null });
    } catch (err) {
      if (!abort.signal.aborted) {
        setState({
          text: "",
          isStreaming: false,
          error: err instanceof Error ? err.message : "Streaming failed",
        });
      }
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ text: "", isStreaming: false, error: null });
  }, []);

  return { ...state, startStream, reset };
}
