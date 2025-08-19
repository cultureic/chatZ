use candid::{CandidType, Principal};
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{Cell, DefaultMemoryImpl, StableBTreeMap, Storable};
use ic_stable_structures::storable::Bound;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::cell::RefCell;

// Memory management
type Memory = VirtualMemory<DefaultMemoryImpl>;

// Message types
#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
pub struct Message {
    pub id: u64,
    pub author: Principal,
    pub content: String,
    pub timestamp: u64,
    pub reply_to: Option<u64>,
    pub message_type: MessageType,
    pub attachments: Vec<Attachment>,
}

#[derive(CandidType, Serialize, Deserialize, Clone, Debug)]
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
