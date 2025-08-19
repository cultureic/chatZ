import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { createChatActor } from "../ic/chat_z_backend/index.js";

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
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [chatActor, setChatActor] = useState(null);

  // For local development, use local canister ID
  // In production, this would be the deployed canister ID
  const CHAT_CANISTER_ID = process.env.CANISTER_ID_CHAT_Z_BACKEND || "rrkah-fqaaa-aaaaa-aaaaq-cai";

  useEffect(() => {
    // Initialize AuthClient
    AuthClient.create(options.createOptions).then(async (client) => {
      await updateClient(client);
      setIsLoading(false);
    });
  }, []);

  const login = () => {
    setIsLoading(true);
    authClient &&
      authClient.login({
        ...options.loginOptions,
        onSuccess: async () => {
          console.log("Login successful");
          await updateClient(authClient);
          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Login failed:", error);
          setIsLoading(false);
        },
      });
  };

  const logout = async () => {
    setIsLoading(true);
    await authClient?.logout();
    await updateClient(authClient);
    setUser(null);
    setChatActor(null);
    setIsLoading(false);
  };

  async function updateClient(client) {
    try {
      const isAuthenticated = await client.isAuthenticated();
      setIsAuthenticated(isAuthenticated);

      const identity = client.getIdentity();
      setIdentity(identity);

      const principal = identity.getPrincipal();
      const principalText = principal.toText();

      setPrincipalText(principalText);
      setPrincipal(principal);
      setAuthClient(client);

      if (isAuthenticated) {
        // Create chat actor with authenticated identity
        const actor = createChatActor(CHAT_CANISTER_ID, {
          agentOptions: { identity },
        });
        setChatActor(actor);

        // Try to get user data
        try {
          const userData = await actor.get_current_user();
          if (userData && userData.length > 0) {
            setUser(userData[0]);
          } else {
            // User not registered yet
            setUser(null);
          }
        } catch (error) {
          console.log("Error fetching user data:", error);
          setUser(null);
        }
      } else {
        setChatActor(null);
        setUser(null);
      }
    } catch (error) {
      console.error("Error updating auth client:", error);
      setIsAuthenticated(false);
      setUser(null);
      setChatActor(null);
    }
  }

  const registerUser = async (username, bio = null) => {
    if (!chatActor) {
      throw new Error("Not authenticated");
    }

    try {
      setIsLoading(true);
      const result = await chatActor.register_user(username, bio ? [bio] : []);
      
      if ('Ok' in result) {
        setUser(result.Ok);
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (updates) => {
    if (!chatActor) {
      throw new Error("Not authenticated");
    }

    try {
      setIsLoading(true);
      const result = await chatActor.update_user(updates);
      
      if ('Ok' in result) {
        setUser(result.Ok);
        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
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
    user,
    chatActor,
    registerUser,
    updateUser,
    CHAT_CANISTER_ID,
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
