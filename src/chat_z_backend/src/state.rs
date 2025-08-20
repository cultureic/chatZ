use candid::{CandidType, Principal};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{Cell, DefaultMemoryImpl, StableBTreeMap, Storable};
use ic_stable_structures::storable::Bound;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::cell::RefCell;
use std::collections::HashMap;

// Memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;

// Message types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Message {
    pub id: u64,
    pub author: Principal,
    pub content: String,
    pub timestamp: u64,
    pub channel_id: Option<u64>,  // Added to track which channel the message belongs to
    pub reply_to: Option<u64>,
    pub message_type: MessageType,
    pub attachments: Vec<Attachment>,
}

#[derive(CandidType, Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum MessageType {
    Text,
    Image,
    System,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Attachment {
    pub file_type: String,
    pub data: Vec<u8>,
    pub filename: String,
    pub size: u64,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct User {
    pub user_principal: Principal,
    pub username: String,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub joined_at: u64,
    pub message_count: u64,
    pub last_active: u64,
    /// Encrypted keys for VetKey-derived encryption keys, keyed by context or message ID
    pub encrypted_keys: HashMap<String, String>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Channel {
    pub id: u64,
    pub name: String,
    pub description: Option<String>,
    pub created_by: Principal,
    pub created_at: u64,
    pub members: Vec<Principal>,
    pub message_count: u64,
    pub last_message_at: Option<u64>,
    pub is_encrypted: bool,
    pub password_hash: Option<String>, // Hashed password for protected channels
}

// Encrypted message structure for VetKeys-based encryption
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct EncryptedMessage {
    pub id: u64,
    pub encrypted_content: String,
    pub author: Principal,
    pub timestamp: u64,
    pub expires_at: u64, // 24 hours from creation
    pub channel_id: Option<u64>,
    pub reply_to: Option<u64>,
    pub message_type: MessageType,
    /// Principals with whom this encrypted message is shared. Does not include the owner.
    pub shared_with: Vec<Principal>,
    pub attachments: Vec<Attachment>,
}

impl EncryptedMessage {
    pub fn is_authorized(&self, user: &Principal) -> bool {
        user == &self.author || self.shared_with.contains(user)
    }
    
    /// Check if a user is authorized to access this message based on channel membership
    pub fn is_authorized_with_channels<F>(&self, user: &Principal, get_channel: F) -> bool 
    where
        F: FnOnce(u64) -> Option<Channel>,
    {
        // Always allow author
        if user == &self.author {
            return true;
        }
        
        // Allow explicitly shared users
        if self.shared_with.contains(user) {
            return true;
        }
        
        // For encrypted messages in channels, allow all channel members
        if let Some(channel_id) = self.channel_id {
            if let Some(channel) = get_channel(channel_id) {
                if channel.is_encrypted && channel.members.contains(user) {
                    return true;
                }
            }
        }
        
        false
    }

    pub fn is_expired(&self, current_time: u64) -> bool {
        current_time > self.expires_at
    }
}

// User IDs for encrypted message sharing
#[derive(CandidType, Deserialize, Default)]
pub struct MessageIds {
    pub ids: Vec<u64>,
}

impl MessageIds {
    pub fn iter(&self) -> impl std::iter::Iterator<Item = &u64> {
        self.ids.iter()
    }
}

// Storable implementations using Candid encoding
impl Storable for Message {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for User {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for Channel {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for EncryptedMessage {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

impl Storable for MessageIds {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(candid::encode_one(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::decode_one(&bytes).unwrap()
    }

    const BOUND: Bound = Bound::Unbounded;
}

// Global state
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
        
    static MESSAGES: RefCell<StableBTreeMap<u64, Message, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0))),
        )
    );
    
    static USERS: RefCell<StableBTreeMap<Principal, User, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(1))),
        )
    );
    
    static CHANNELS: RefCell<StableBTreeMap<u64, Channel, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(2))),
        )
    );
    
    static NEXT_MESSAGE_ID: RefCell<Cell<u64, Memory>> = RefCell::new(
        Cell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(3))),
            1
        ).unwrap()
    );
    
    static NEXT_CHANNEL_ID: RefCell<Cell<u64, Memory>> = RefCell::new(
        Cell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(4))),
            1
        ).unwrap()
    );
    
    // Encrypted messages storage
    static ENCRYPTED_MESSAGES: RefCell<StableBTreeMap<u64, EncryptedMessage, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(5))),
        )
    );
    
    // Maps user to owned encrypted message IDs
    static ENCRYPTED_MESSAGE_OWNERS: RefCell<StableBTreeMap<Principal, MessageIds, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(6))),
        )
    );
    
    // Maps user to shared encrypted message IDs
    static ENCRYPTED_MESSAGE_SHARES: RefCell<StableBTreeMap<Principal, MessageIds, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(7))),
        )
    );
    
    // VetKey name for this canister
    static KEY_NAME: RefCell<Cell<String, Memory>> = RefCell::new(
        Cell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(8))),
            String::new()
        ).unwrap()
    );
}

// State access functions
pub fn with_messages<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<u64, Message, Memory>) -> R,
{
    MESSAGES.with(|m| f(&m.borrow()))
}

pub fn with_messages_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<u64, Message, Memory>) -> R,
{
    MESSAGES.with(|m| f(&mut m.borrow_mut()))
}

pub fn with_users<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<Principal, User, Memory>) -> R,
{
    USERS.with(|u| f(&u.borrow()))
}

pub fn with_users_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<Principal, User, Memory>) -> R,
{
    USERS.with(|u| f(&mut u.borrow_mut()))
}

pub fn with_channels<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<u64, Channel, Memory>) -> R,
{
    CHANNELS.with(|c| f(&c.borrow()))
}

pub fn with_channels_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<u64, Channel, Memory>) -> R,
{
    CHANNELS.with(|c| f(&mut c.borrow_mut()))
}

pub fn next_message_id() -> u64 {
    NEXT_MESSAGE_ID.with(|id| {
        let current = id.borrow().get().clone();
        id.borrow_mut().set(current + 1).unwrap();
        current
    })
}

pub fn next_channel_id() -> u64 {
    NEXT_CHANNEL_ID.with(|id| {
        let current = id.borrow().get().clone();
        id.borrow_mut().set(current + 1).unwrap();
        current
    })
}

// Encrypted message access functions
pub fn with_encrypted_messages<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<u64, EncryptedMessage, Memory>) -> R,
{
    ENCRYPTED_MESSAGES.with(|m| f(&m.borrow()))
}

pub fn with_encrypted_messages_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<u64, EncryptedMessage, Memory>) -> R,
{
    ENCRYPTED_MESSAGES.with(|m| f(&mut m.borrow_mut()))
}

pub fn with_encrypted_message_owners<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<Principal, MessageIds, Memory>) -> R,
{
    ENCRYPTED_MESSAGE_OWNERS.with(|o| f(&o.borrow()))
}

pub fn with_encrypted_message_owners_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<Principal, MessageIds, Memory>) -> R,
{
    ENCRYPTED_MESSAGE_OWNERS.with(|o| f(&mut o.borrow_mut()))
}

pub fn with_encrypted_message_shares<F, R>(f: F) -> R
where
    F: FnOnce(&StableBTreeMap<Principal, MessageIds, Memory>) -> R,
{
    ENCRYPTED_MESSAGE_SHARES.with(|s| f(&s.borrow()))
}

pub fn with_encrypted_message_shares_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut StableBTreeMap<Principal, MessageIds, Memory>) -> R,
{
    ENCRYPTED_MESSAGE_SHARES.with(|s| f(&mut s.borrow_mut()))
}

// VetKey functions
pub fn with_key_name<F, R>(f: F) -> R
where
    F: FnOnce(&Cell<String, Memory>) -> R,
{
    KEY_NAME.with(|k| f(&k.borrow()))
}

pub fn with_key_name_mut<F, R>(f: F) -> R
where
    F: FnOnce(&mut Cell<String, Memory>) -> R,
{
    KEY_NAME.with(|k| f(&mut k.borrow_mut()))
}
