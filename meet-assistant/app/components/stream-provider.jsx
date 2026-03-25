import dynamic from "next/dynamic";
import { StreamVideo } from "@stream-io/video-react-sdk";
import { useStreamClients } from "../hooks/use-stream-clients";
import { Chat } from "stream-chat-react";

const AILoading = dynamic(() => import("./AILoading"), { ssr: false });
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

export default function StreamProvider({ children, user, token }) {
  const { videoClient, chatClient } = useStreamClients({ apiKey, user, token });

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-mesh-with-grid flex items-center justify-center px-4">
        <div className="glass-panel rounded-2xl p-8 max-w-md border-(--danger)/40">
          <h2 className="font-display text-lg tracking-wider text-(--danger) mb-2">
            Configuration error
          </h2>
          <p className="text-(--text-muted) text-sm">
            Set NEXT_PUBLIC_STREAM_API_KEY in your .env file.
          </p>
        </div>
      </div>
    );
  }

  if (!videoClient || !chatClient) {
    return <AILoading />;
  }

  return (
    <StreamVideo client={videoClient}>
      <Chat client={chatClient}>{children}</Chat>
    </StreamVideo>
  );
}
