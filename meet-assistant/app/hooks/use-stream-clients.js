import { useEffect, useState, useRef } from "react";
import { StreamVideoClient } from "@stream-io/video-client";
import { StreamChat } from "stream-chat";

export function useStreamClients({apiKey,user,token}){
    const[videoClient,setVideoClient] = useState(null);
    const[chatClient,setChatClient] = useState(null);
    const chatClientRef = useRef(null);
    const isInitializingRef = useRef(false);

    useEffect(()=>{
        if(!apiKey || !user || !token) {
            console.warn("Missing required parameters for Stream clients:", {apiKey: !!apiKey, user: !!user, token: !!token});
            return;
        }
        
        // Prevent multiple simultaneous initializations
        if(isInitializingRef.current) return;
        
        let isMounted = true;
        isInitializingRef.current = true;
        
        const initClients = async () => {
            try {
                console.log("Initializing Stream clients with:", { apiKey: !!apiKey, user: !!user, token: !!token });

                // Create or reuse a single StreamVideoClient instance
                const myVideoClient = StreamVideoClient.getOrCreateInstance({
                    apiKey,
                    user,
                    token
                });
                console.log("Created/reused StreamVideoClient instance");                // Get or create chat client instance
                const myChatClient = StreamChat.getInstance(apiKey);
                chatClientRef.current = myChatClient;
                
                // Check if user is already connected to avoid consecutive calls
                const currentUser = myChatClient.user;
                const isSameUser = currentUser && currentUser.id === user.id;
                
                if (!isSameUser) {
                    // Disconnect previous user if different
                    if (currentUser) {
                        await myChatClient.disconnectUser();
                    }
                    // Connect user if not already connected
                    await myChatClient.connectUser(user, token);
                }
                
                if(isMounted){
                    setVideoClient(myVideoClient);
                    setChatClient(myChatClient);
                }
            } catch (error) {
                console.error("Error initializing Stream clients:", error);
            } finally {
                isInitializingRef.current = false;
            }
        };
        
        initClients();
        
        return () => {
            isMounted = false;
            isInitializingRef.current = false;
            // Cleanup: disconnect clients on unmount
            if(chatClientRef.current) {
                const client = chatClientRef.current;
                client.disconnectUser().catch((err) => {
                    // Ignore errors during cleanup
                    console.debug("Error disconnecting user during cleanup:", err);
                });
                chatClientRef.current = null;
            }
        };
    },[apiKey,user,token]);
    
    return {videoClient,chatClient};
};
