import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "../../../../declarations/chat_z_backend/chat_z_backend.did.js";

// FORCE PRODUCTION SETTINGS
const IS_PRODUCTION = true;
const PRODUCTION_CANISTER_ID = "evkxr-waaaa-aaaag-attza-cai";
const PRODUCTION_HOST = "https://ic0.app";

const createActor = (canisterId, options) => {
  const host = IS_PRODUCTION ? PRODUCTION_HOST : "http://127.0.0.1:4943";
  console.log(`🚀 PRODUCTION MODE: Connecting to host: ${host} with canister: ${canisterId}`);
  
  const agent = new HttpAgent({
    host,
    ...options?.agentOptions,
  });

  // Only fetch root key in local development
  if (!IS_PRODUCTION) {
    agent.fetchRootKey().catch((err) => {
      console.warn(
        "Unable to fetch root key. Check to ensure that your local replica is running"
      );
      console.error(err);
    });
  }

  return Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options?.actorOptions,
  });
};

export const createChatActor = (canisterId, options) => {
  return createActor(canisterId, options);
};

// FORCE PRODUCTION CANISTER ID
export const getChatCanisterId = () => {
  return PRODUCTION_CANISTER_ID;
};

export const DEFAULT_CHAT_CANISTER_ID = getChatCanisterId();
