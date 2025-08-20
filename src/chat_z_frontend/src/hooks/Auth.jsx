import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { createChatActor, getChatCanisterId } from "../ic/chat_z/index.js";

const AuthContext = createContext(null);

const defaultOptions = {
  createOptions: {
    idleOptions: {
      // Set to true if you do not want idle functionality
    },
  },
  loginOptions: {
    identityProvider: "https://identity.ic0.app/#authorize",
  },
};

export const useAuthClient = (options = defaultOptions) => {
  const [isAuth, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [principalText, setPrincipalText] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Chat Z canister ID - dynamically determined based on environment
  const CHAT_Z_CANISTER_ID = getChatCanisterId();

  const addMessage = (text, type = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    const newMessage = { id, text, type };

    setMessages((prev) => [...prev, newMessage]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeMessage(id);
    }, 5000);
  };

  const removeMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  useEffect(() => {
    // Initialize AuthClient
    AuthClient.create(options.createOptions).then(async (client) => {
      updateClient(client);
    });
  }, []);

  const login = () => {
    authClient &&
      authClient.login({
        ...options.loginOptions,
        onSuccess: () => {
          console.log("Login successful");
          updateClient(authClient);
        },
      });
  };

  // Load user data from backend
  const loadCurrentUser = async (identity) => {
    if (!identity) {
      setCurrentUser(null);
      return;
    }

    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const user = await chatActor.get_current_user();
      setCurrentUser(user.length > 0 ? user[0] : null);
    } catch (error) {
      console.log('Error loading current user:', error);
      setCurrentUser(null);
    }
  };

  async function updateClient(client) {
    const isAuthenticated = await client.isAuthenticated();
    setIsAuthenticated(isAuthenticated);

    const identity = client.getIdentity();
    setIdentity(identity);

    const principal = identity.getPrincipal();
    let principalText = Principal.fromUint8Array(principal._arr).toText();

    setPrincipalText(principalText);
    setPrincipal(principal);
    setAuthClient(client);

    // Load user data if authenticated
    if (isAuthenticated) {
      await loadCurrentUser(identity);
      console.log('User authenticated, principal:', principalText);
      addMessage("Welcome to Chat Z!", "success");
    } else {
      setCurrentUser(null);
    }
  }

  async function logout() {
    await authClient?.logout();
    await updateClient(authClient);
    addMessage("Logged out successfully", "info");
  }

  const registerUser = async (username, bio = null) => {
    if (!identity) {
      addMessage("Please login first", "error");
      return null;
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const result = await chatActor.register_user(username, bio ? [bio] : []);
      
      if ('Ok' in result) {
        setCurrentUser(result.Ok);
        
        // Auto-join the General channel (ID = 1) after registration
        try {
          await chatActor.join_channel(1);
          console.log("Successfully joined General channel");
        } catch (joinError) {
          console.log("Failed to join General channel (likely already a member):", joinError);
        }
        
        addMessage("Registration successful!", "success");
        return result.Ok;
      } else {
        const errorMsg = Object.keys(result.Err)[0] || "Registration failed";
        addMessage(`Registration failed: ${errorMsg}`, "error");
        return null;
      }
    } catch (error) {
      console.error('Registration error:', error);
      addMessage("Registration failed", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates) => {
    if (!identity) {
      addMessage("Please login first", "error");
      return null;
    }

    setIsLoading(true);
    try {
      const chatActor = createChatActor(CHAT_Z_CANISTER_ID, {
        agentOptions: { identity },
      });
      const result = await chatActor.update_user(updates);
      
      if ('Ok' in result) {
        setCurrentUser(result.Ok);
        addMessage("Profile updated successfully!", "success");
        return result.Ok;
      } else {
        const errorMsg = Object.keys(result.Err)[0] || "Update failed";
        addMessage(`Update failed: ${errorMsg}`, "error");
        return null;
      }
    } catch (error) {
      console.error('Update error:', error);
      addMessage("Update failed", "error");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuth,
    login,
    logout,
    authClient,
    identity,
    principal,
    principalText,
    isLoading,
    setIsLoading,
    messages,
    addMessage,
    removeMessage,
    currentUser,
    registerUser,
    updateUser,
    loadCurrentUser,
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
