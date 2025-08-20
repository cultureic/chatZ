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
  const [encryptedMessages, setEncryptedMessages] = useState([]);
  const [decryptedMessages, setDecryptedMessages] = useState({});

  const CHAT_Z_CANISTER_ID = getChatCanisterId();

  useEffect(() => {
    if (isAuth && identity) {
      loadInitialData();
    } else {
      // Load basic data even for non-authenticated users
      loadChannelsPublic();
    }
  }, [isAuth, identity]);
  
  // Load channels without authentication for guest viewing
  const loadChannelsPublic = async () => {
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: {},
      });
      const channelList = await chatActor.get_all_channels();
      setChannels(channelList);
      
      // Auto-select the General channel if none selected
      const generalChannel = channelList.find(ch => ch.id === 1);
      if (generalChannel && !currentChannel) {
        setCurrentChannel(generalChannel);
      }
    } catch (error) {
      console.error('Error loading channels (public):', error);
      // Don't show error for non-authenticated users
    }
  };

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
      
      // Auto-join General channel (ID 1) if user is not already a member
      const generalChannel = channelList.find(ch => ch.id === 1);
      if (generalChannel && identity) {
        const currentUserPrincipal = identity.getPrincipal().toText();
        const isAlreadyMember = generalChannel.members.some(member => 
          member.toText ? member.toText() === currentUserPrincipal : member.toString() === currentUserPrincipal
        );
        
        if (!isAlreadyMember) {
          console.log('Auto-joining General channel...');
          try {
            await chatActor.join_channel(1, []);
            console.log('Successfully joined General channel');
            // Reload channels to get updated membership
            const updatedChannelList = await chatActor.get_all_channels();
            setChannels(updatedChannelList);
          } catch (joinError) {
            console.log('Failed to auto-join General channel:', joinError);
          }
        }
      }
      
      // Auto-select the General channel if none selected
      const updatedGeneralChannel = channels.find(ch => ch.id === 1) || generalChannel;
      if (updatedGeneralChannel && !currentChannel) {
        setCurrentChannel(updatedGeneralChannel);
        loadMessages(updatedGeneralChannel.id);
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
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: identity ? { identity } : {},
      });
      
      if (identity) {
        // Authenticated users: get regular messages
        const result = await chatActor.get_messages(
          channelId ? [channelId] : [],
          [limit],
          [offset]
        );
        // Sort messages newest first
        const sortedMessages = result.messages.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        setMessages(sortedMessages);
        return result;
      } else {
        // Guest users: only show messages for non-encrypted channels
        // For encrypted channels, they'll see encrypted messages via loadEncryptedMessages
        if (channelId && currentChannel && currentChannel.is_encrypted) {
          // For encrypted channels, guests don't see regular messages
          setMessages([]);
          return { messages: [], total_count: 0, has_more: false };
        } else {
          // For regular channels, guests can see messages
          const result = await chatActor.get_messages(
            channelId ? [channelId] : [],
            [limit],
            [offset]
          );
          setMessages(result.messages);
          return result;
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      if (identity) {
        addMessage("Failed to load messages", "error");
      }
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
        reply_to: replyTo ? replyTo : [],
        message_type: messageType,
        attachments: attachments,
      };
      console.log("idiot request",request)
      const result = await chatActor.send_message(request);
      console.log("what that fuck",result)
      
      if ('Ok' in result) {
        // Reload messages to show the new message
        await loadMessages(currentChannel?.id);
        addMessage("Message sent successfully!", "success");
        return result.Ok;
      } else {
        const errorMsg = Object.keys(result.Err)[0] || "Failed to send message";
        
        // Handle NotAuthorized error by attempting to join the channel
        if (errorMsg === "NotAuthorized" && currentChannel) {
          addMessage("Not a member of this channel. Attempting to join...", "info");
          
          // Check if channel requires password
          if (currentChannel.password_hash) {
            const password = prompt('This channel requires a password to join:');
            if (!password) return null; // User cancelled
            const joinResult = await joinChannel(currentChannel.id, password);
            if (joinResult) {
              // Retry sending the message after joining
              addMessage("Joined channel! Retrying message...", "info");
              const retryResult = await chatActor.send_message(request);
            } else {
              return null;
            }
          } else {
            const joinResult = await joinChannel(currentChannel.id);
            if (joinResult) {
              // Retry sending the message after joining
              addMessage("Joined channel! Retrying message...", "info");
              const retryResult = await chatActor.send_message(request);
            } else {
              return null;
            }
            
            if ('Ok' in retryResult) {
              await loadMessages(currentChannel?.id);
              addMessage("Message sent successfully after joining channel!", "success");
              return retryResult.Ok;
            } else {
              const retryErrorMsg = Object.keys(retryResult.Err)[0] || "Failed to send message";
              addMessage(`Failed to send message after joining: ${retryErrorMsg}`, "error");
              return null;
            }
            addMessage("Failed to join channel and send message", "error");
            return null;
          }
        } else {
          addMessage(`Failed to send message: ${errorMsg}`, "error");
          return null;
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addMessage("Failed to send message", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  const createChannel = async ({ name, description, isEncrypted, password }) => {
    if (!identity || !name.trim()) {
      addMessage("Please enter a channel name", "error");
      return null;
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });

      let result;
      if (isEncrypted) {
        result = await chatActor.create_encrypted_channel(
          name.trim(),
          description ? [description.trim()] : [],
          password ? [password.trim()] : []
        );
      } else {
        const request = {
          name: name.trim(),
          description: description ? [description.trim()] : [],
        };
        result = await chatActor.create_channel(request);
      }

      if ('Ok' in result) {
        await loadChannels(); // Reload channels
        addMessage(`Channel created successfully!`, "success");
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

  const joinChannel = async (channelId, password) => {
    if (!identity) {
      addMessage("Please login first", "error");
      return false;
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });

      // Fix: send password as null if not provided
      console.log('Joining channel with:', { channelId, password });
      const result = await chatActor.join_channel(Number(channelId), password ? password : []);
      
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

  const selectChannel = async (channel) => {
    console.log('Selecting channel:', channel);
    setCurrentChannel(channel);
    // Clear messages first to show loading state
    setMessages([]);
    setEncryptedMessages([]);
    
    if (channel) {
      try {
        // Load regular messages
        await loadMessages(channel.id);
        console.log('Loaded regular messages for channel:', channel.id);
        
        // Load encrypted messages if it's an encrypted channel
        if (channel.is_encrypted) {
          await loadEncryptedMessages(channel.id);
          console.log('Loaded encrypted messages for channel:', channel.id);
        }
      } catch (error) {
        console.error('Error loading messages for channel:', channel.id, error);
      }
    }
  };

  const refreshData = async () => {
    await loadInitialData();
    if (currentChannel) {
      await loadMessages(currentChannel.id);
      if (currentChannel.is_encrypted) {
        await loadEncryptedMessages(currentChannel.id);
      }
    }
  };


  const sendEncryptedMessage = async (content, channelId = null, replyTo = null, messageType = { Text: null }, attachments = []) => {
    if (!identity || !content.trim()) {
      addMessage("Please enter a message", "error");
      return null;
    }
  
    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      
      console.log("Sending encrypted message with params:", {
        content: content.trim(),
        channelId: channelId ? [BigInt(channelId)] : [],
        replyTo: replyTo ? [BigInt(replyTo)] : [],
        messageType: messageType,
        attachments: attachments
      });
      
      const result = await chatActor.create_encrypted_message(
        content.trim(),
        channelId ? [BigInt(channelId)] : [],  // opt nat64
        replyTo ? [BigInt(replyTo)] : [],      // opt nat64 (THIS WAS MISSING/MISPLACED)
        messageType,                           // MessageType
        attachments || []                       // vec Attachment
      );
      
      console.log("result", result);
      
      if ('Ok' in result) {
        // Reload encrypted messages to show the new message
        if (channelId) {
          await loadEncryptedMessages(channelId);
        } else {
          await loadAllEncryptedMessages();
        }
        addMessage("Encrypted message sent successfully!", "success");
        return result.Ok;
      } else {
        const errorMsg = Object.keys(result.Err)[0] || "Failed to send encrypted message";
        
        // Handle NotAuthorized error by attempting to join the channel
        if (errorMsg === "NotAuthorized" && channelId) {
          addMessage("Not a member of this encrypted channel. Attempting to join...", "info");
          
          // Check if channel requires password
          const channel = channels.find(ch => ch.id === channelId);
          if (channel?.password_hash) {
            const password = prompt('This channel requires a password to join:');
            if (!password) return null;
            const joinResult = await joinChannel(channelId, password);
            if (joinResult) {
              // Retry sending the encrypted message after joining
              addMessage("Joined encrypted channel! Retrying message...", "info");
              const retryResult = await chatActor.create_encrypted_message(
                content.trim(),
                channelId ? [BigInt(channelId)] : [],
                replyTo ? [BigInt(replyTo)] : [],
                messageType,
                attachments || []
              );
              
              if ('Ok' in retryResult) {
                if (channelId) {
                  await loadEncryptedMessages(channelId);
                } else {
                  await loadAllEncryptedMessages();
                }
                addMessage("Encrypted message sent successfully after joining channel!", "success");
                return retryResult.Ok;
              }
            }
          } else {
            const joinResult = await joinChannel(channelId);
            if (joinResult) {
              // Retry sending the encrypted message after joining
              addMessage("Joined encrypted channel! Retrying message...", "info");
              const retryResult = await chatActor.create_encrypted_message(
                content.trim(),
                channelId ? [BigInt(channelId)] : [],
                replyTo ? [BigInt(replyTo)] : [],
                messageType,
                attachments || []
              );
              
              if ('Ok' in retryResult) {
                if (channelId) {
                  await loadEncryptedMessages(channelId);
                } else {
                  await loadAllEncryptedMessages();
                }
                addMessage("Encrypted message sent successfully after joining channel!", "success");
                return retryResult.Ok;
              }
            }
          }
        }
        
        addMessage(`Failed to send encrypted message: ${errorMsg}`, "error");
        return null;
      }
    } catch (error) {
      console.error('Error sending encrypted message:', error);
      addMessage("Failed to send encrypted message", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadEncryptedMessages = async (channelId) => {
    if (!channelId) return;

    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: identity ? { identity } : {},
      });
      const encryptedMessageList = await chatActor.get_encrypted_messages_from_channel(channelId);
      // Sort encrypted messages newest first
      const sortedEncryptedMessages = encryptedMessageList.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      setEncryptedMessages(sortedEncryptedMessages);
      return encryptedMessageList;
    } catch (error) {
      console.error('Error loading encrypted messages:', error);
      // Don't show error message for non-authenticated users
      if (identity) {
        addMessage("Failed to load encrypted messages", "error");
      }
      return [];
    }
  };

  const loadAllEncryptedMessages = async () => {
    if (!identity) return;

    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const encryptedMessageList = await chatActor.get_encrypted_messages();
      setEncryptedMessages(encryptedMessageList);
      return encryptedMessageList;
    } catch (error) {
      console.error('Error loading all encrypted messages:', error);
      addMessage("Failed to load encrypted messages", "error");
      return [];
    }
  };

  const decryptMessage = async (messageId) => {
    if (!identity || !messageId) return null;

    // Check if already decrypted
    if (decryptedMessages[messageId]) {
      return decryptedMessages[messageId];
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const result = await chatActor.decrypt_encrypted_message(messageId);
      
      if ('Ok' in result) {
        const decryptedContent = result.Ok;
        setDecryptedMessages(prev => ({
          ...prev,
          [messageId]: decryptedContent
        }));
        return decryptedContent;
      } else {
        const errorMsg = result.Err || "Failed to decrypt message";
        addMessage(`Failed to decrypt message: ${errorMsg}`, "error");
        return null;
      }
    } catch (error) {
      console.error('Error decrypting message:', error);
      addMessage("Failed to decrypt message", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const decryptAllChannelMessages = async (channelId) => {
    if (!identity || !channelId) return [];

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const decryptedMessageList = await chatActor.decrypt_all_messages_from_channel(channelId);
      
      // Store decrypted messages in state
      const newDecryptedMessages = {};
      decryptedMessageList.forEach(msg => {
        newDecryptedMessages[msg.id] = msg.content;
      });
      setDecryptedMessages(prev => ({
        ...prev,
        ...newDecryptedMessages
      }));
      
      addMessage(`Decrypted ${decryptedMessageList.length} messages successfully!`, "success");
      return decryptedMessageList;
    } catch (error) {
      console.error('Error decrypting channel messages:', error);
      addMessage("Failed to decrypt channel messages", "error");
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for new messages
  useEffect(() => {
    if (!currentChannel) return;

    const interval = setInterval(async () => {
      // Regular messages
      await loadMessages(currentChannel.id);

      // Encrypted messages if needed
      if (currentChannel.is_encrypted) {
        await loadEncryptedMessages(currentChannel.id);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [currentChannel]);

  return {
    channels,
    messages,
    currentChannel,
    users,
    stats,
    encryptedMessages,
    decryptedMessages,
    loadChannels,
    loadUsers,
    loadMessages,
    loadStats,
    sendMessage,
    createChannel,
    joinChannel,
    selectChannel,
    refreshData,
    // Encrypted messaging functions
    sendEncryptedMessage,
    loadEncryptedMessages,
    loadAllEncryptedMessages,
    decryptMessage,
    decryptAllChannelMessages,
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
