import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./Auth";

const ChatContext = createContext(null);

export const useChatClient = () => {
  const { chatActor, isAuth, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [channels, setChannels] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ users: 0, messages: 0, channels: 0 });

  // Fetch channels
  const fetchChannels = useCallback(async () => {
    if (!chatActor) return;

    try {
      setIsLoading(true);
      const channelsData = await chatActor.get_all_channels();
      setChannels(channelsData);
      
      // Auto-select general channel if no current channel
      if (!currentChannel && channelsData.length > 0) {
        const generalChannel = channelsData.find(c => c.name.toLowerCase() === 'general') || channelsData[0];
        setCurrentChannel(generalChannel);
      }
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setIsLoading(false);
    }
  }, [chatActor, currentChannel]);

  // Fetch messages
  const fetchMessages = useCallback(async (channelId = null, limit = 50, offset = 0) => {
    if (!chatActor) return;

    try {
      setIsLoading(true);
      const result = await chatActor.get_messages(
        channelId ? [channelId] : [],
        [limit],
        [offset]
      );
      setMessages(result.messages);
      return result;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return { messages: [], total_count: 0, has_more: false };
    } finally {
      setIsLoading(false);
    }
  }, [chatActor]);

  // Send message
  const sendMessage = useCallback(async (content, messageType = { Text: null }, attachments = []) => {
    if (!chatActor || !user) {
      throw new Error("Not authenticated or user not registered");
    }

    try {
      setIsLoading(true);
      const request = {
        content,
        channel_id: currentChannel ? [currentChannel.id] : [],
        reply_to: [],
        message_type: messageType,
        attachments: attachments,
      };

      const result = await chatActor.send_message(request);
      
      if ('Ok' in result) {
        // Refresh messages after sending
        await fetchMessages(currentChannel?.id);
        return result.Ok;
      } else {
        throw new Error(`Failed to send message: ${JSON.stringify(result.Err)}`);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chatActor, user, currentChannel, fetchMessages]);

  // Create channel
  const createChannel = useCallback(async (name, description = null) => {
    if (!chatActor || !user) {
      throw new Error("Not authenticated or user not registered");
    }

    try {
      setIsLoading(true);
      const request = {
        name,
        description: description ? [description] : [],
      };

      const result = await chatActor.create_channel(request);
      
      if ('Ok' in result) {
        await fetchChannels(); // Refresh channels
        return result.Ok;
      } else {
        throw new Error(`Failed to create channel: ${JSON.stringify(result.Err)}`);
      }
    } catch (error) {
      console.error("Error creating channel:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chatActor, user, fetchChannels]);

  // Join channel
  const joinChannel = useCallback(async (channelId) => {
    if (!chatActor || !user) {
      throw new Error("Not authenticated or user not registered");
    }

    try {
      setIsLoading(true);
      const result = await chatActor.join_channel(channelId);
      
      if ('Ok' in result) {
        await fetchChannels(); // Refresh channels to update membership
        return true;
      } else {
        throw new Error(`Failed to join channel: ${JSON.stringify(result.Err)}`);
      }
    } catch (error) {
      console.error("Error joining channel:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [chatActor, user, fetchChannels]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    if (!chatActor) return;

    try {
      const statsData = await chatActor.get_stats();
      const statsObj = {};
      statsData.forEach(([key, value]) => {
        statsObj[key] = Number(value);
      });
      setStats(statsObj);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [chatActor]);

  // Auto-refresh messages
  const startAutoRefresh = useCallback(() => {
    const interval = setInterval(async () => {
      if (chatActor && currentChannel) {
        await fetchMessages(currentChannel.id);
      }
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [chatActor, currentChannel, fetchMessages]);

  // Load initial data when authenticated
  useEffect(() => {
    if (isAuth && chatActor && user) {
      fetchChannels();
      fetchStats();
    }
  }, [isAuth, chatActor, user, fetchChannels, fetchStats]);

  // Load messages when channel changes
  useEffect(() => {
    if (currentChannel && chatActor) {
      fetchMessages(currentChannel.id);
    }
  }, [currentChannel, chatActor, fetchMessages]);

  // Auto-refresh messages
  useEffect(() => {
    if (currentChannel && chatActor) {
      const cleanup = startAutoRefresh();
      return cleanup;
    }
  }, [currentChannel, chatActor, startAutoRefresh]);

  return {
    messages,
    channels,
    currentChannel,
    setCurrentChannel,
    isLoading,
    stats,
    sendMessage,
    fetchMessages,
    fetchChannels,
    createChannel,
    joinChannel,
    fetchStats,
  };
};

export const ChatProvider = ({ children }) => {
  const chat = useChatClient();
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
