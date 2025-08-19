import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./Auth.jsx";
import { createChatActor, getChatCanisterId } from "../ic/chat_z/index.js";

const ChatContext = createContext(null);

export const useChatClient = () => {
  const { identity, isAuth, addMessage, isLoading, setIsLoading } = useAuth();
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});

  const CHAT_Z_CANISTER_ID = getChatCanisterId();

  useEffect(() => {
    if (isAuth && identity) {
      loadInitialData();
    }
  }, [isAuth, identity]);

  const loadInitialData = async () => {
    await Promise.all([
      loadChannels(),
      loadUsers(),
      loadStats(),
    ]);
  };

  const loadChannels = async () => {
    if (!identity) return;

    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const channelList = await chatActor.get_all_channels();
      setChannels(channelList);
      
      // Auto-select the first channel if none selected
      if (channelList.length > 0 && !currentChannel) {
        setCurrentChannel(channelList[0]);
        loadMessages(channelList[0].id);
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      addMessage("Failed to load channels", "error");
    }
  };

  const loadUsers = async () => {
    if (!identity) return;

    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const userList = await chatActor.get_all_users();
      setUsers(userList);
    } catch (error) {
      console.error('Error loading users:', error);
      addMessage("Failed to load users", "error");
    }
  };

  const loadStats = async () => {
    if (!identity) return;

    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const statsData = await chatActor.get_stats();
      
      // Convert the vec of records to an object
      const statsObject = {};
      statsData.forEach(([key, value]) => {
        statsObject[key] = Number(value);
      });
      setStats(statsObject);
    } catch (error) {
      console.error('Error loading stats:', error);
      addMessage("Failed to load stats", "error");
    }
  };

  const loadMessages = async (channelId = null, limit = 50, offset = 0) => {
    if (!identity) return;

    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const result = await chatActor.get_messages(
        channelId ? [channelId] : [],
        [limit],
        [offset]
      );
      setMessages(result.messages);
      return result;
    } catch (error) {
      console.error('Error loading messages:', error);
      addMessage("Failed to load messages", "error");
      return null;
    }
  };

  const sendMessage = async (content, messageType = { Text: null }, attachments = [], replyTo = null) => {
    if (!identity || !content.trim()) {
      addMessage("Please enter a message", "error");
      return null;
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      
      const request = {
        content: content.trim(),
        channel_id: currentChannel ? [currentChannel.id] : [],
        reply_to: replyTo ? [replyTo] : [],
        message_type: messageType,
        attachments: attachments,
      };

      const result = await chatActor.send_message(request);
      
      if ('Ok' in result) {
        // Reload messages to show the new message
        await loadMessages(currentChannel?.id);
        addMessage("Message sent successfully!", "success");
        return result.Ok;
      } else {
        const errorMsg = Object.keys(result.Err)[0] || "Failed to send message";
        addMessage(`Failed to send message: ${errorMsg}`, "error");
        return null;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage("Failed to send message", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createChannel = async (name, description = null) => {
    if (!identity || !name.trim()) {
      addMessage("Please enter a channel name", "error");
      return null;
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      
      const request = {
        name: name.trim(),
        description: description ? [description.trim()] : [],
      };

      const result = await chatActor.create_channel(request);
      
      if ('Ok' in result) {
        await loadChannels(); // Reload channels
        addMessage("Channel created successfully!", "success");
        return result.Ok;
      } else {
        const errorMsg = Object.keys(result.Err)[0] || "Failed to create channel";
        addMessage(`Failed to create channel: ${errorMsg}`, "error");
        return null;
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      addMessage("Failed to create channel", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const joinChannel = async (channelId) => {
    if (!identity) {
      addMessage("Please login first", "error");
      return false;
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      
      const result = await chatActor.join_channel(channelId);
      
      if ('Ok' in result) {
        await loadChannels(); // Reload channels to update membership
        addMessage("Joined channel successfully!", "success");
        return true;
      } else {
        const errorMsg = Object.keys(result.Err)[0] || "Failed to join channel";
        addMessage(`Failed to join channel: ${errorMsg}`, "error");
        return false;
      }
    } catch (error) {
      console.error('Error joining channel:', error);
      addMessage("Failed to join channel", "error");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const selectChannel = (channel) => {
    setCurrentChannel(channel);
    if (channel) {
      loadMessages(channel.id);
    }
  };

  const refreshData = async () => {
    await loadInitialData();
    if (currentChannel) {
      await loadMessages(currentChannel.id);
    }
  };

  return {
    channels,
    messages,
    currentChannel,
    users,
    stats,
    loadChannels,
    loadUsers,
    loadMessages,
    loadStats,
    sendMessage,
    createChannel,
    joinChannel,
    selectChannel,
    refreshData,
  };
};

export const ChatProvider = ({ children }) => {
  const chatClient = useChatClient();
  return (
    <ChatContext.Provider value={chatClient}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
