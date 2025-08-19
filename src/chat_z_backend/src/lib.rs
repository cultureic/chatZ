mod state;

use candid::{CandidType, Principal};
use ic_cdk::api::{caller, time};
use ic_cdk::{init, post_upgrade};
use serde::{Deserialize, Serialize};

pub use state::{Attachment, Channel, Message, MessageType, User};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum ChatError {
    NotFound,
    NotAuthorized,
    InvalidInput,
    UserAlreadyExists,
    ChannelNotFound,
    MessageTooLarge,
    AttachmentTooLarge,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct CreateMessageRequest {
    pub content: String,
    pub channel_id: Option<u64>,
    pub reply_to: Option<u64>,
    pub message_type: MessageType,
    pub attachments: Vec<Attachment>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct CreateChannelRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub username: Option<String>,
    pub bio: Option<String>,
    pub avatar_url: Option<String>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct MessageWithAuthor {
    pub id: u64,
    pub author: Principal,
    pub author_username: String,
    pub content: String,
    pub timestamp: u64,
    pub reply_to: Option<u64>,
    pub message_type: MessageType,
    pub attachments: Vec<Attachment>,
}

#[derive(CandidType, Serialize, Deserialize)]
pub struct PaginatedMessages {
    pub messages: Vec<MessageWithAuthor>,
    pub total_count: u64,
    pub has_more: bool,
}

// User management
#[ic_cdk::update]
pub fn register_user(username: String, bio: Option<String>) -> Result<User, ChatError> {
    let caller = caller();
    
    if username.trim().is_empty() || username.len() > 50 {
        return Err(ChatError::InvalidInput);
    }
    
    // Check if user already exists
    let user_exists = state::with_users(|users| {
        users.get(&caller).is_some()
    });
    
    if user_exists {
        return Err(ChatError::UserAlreadyExists);
    }
    
    let current_time = time();
    let user = User {
        user_principal: caller,
        username: username.trim().to_string(),
        avatar_url: None,
        bio,
        joined_at: current_time,
        message_count: 0,
        last_active: current_time,
    };
    
    state::with_users_mut(|users| {
        users.insert(caller, user.clone());
    });
    
    Ok(user)
}

#[ic_cdk::update]
pub fn update_user(request: UpdateUserRequest) -> Result<User, ChatError> {
    let caller = caller();
    
    state::with_users_mut(|users| {
        match users.get(&caller) {
            Some(mut user) => {
                if let Some(username) = request.username {
                    if username.trim().is_empty() || username.len() > 50 {
                        return Err(ChatError::InvalidInput);
                    }
                    user.username = username.trim().to_string();
                }
                if let Some(bio) = request.bio {
                    user.bio = if bio.trim().is_empty() { None } else { Some(bio.trim().to_string()) };
                }
                if let Some(avatar_url) = request.avatar_url {
                    user.avatar_url = if avatar_url.trim().is_empty() { None } else { Some(avatar_url.trim().to_string()) };
                }
                user.last_active = time();
                users.insert(caller, user.clone());
                Ok(user)
            }
            None => Err(ChatError::NotFound),
        }
    })
}

#[ic_cdk::query]
pub fn get_user(principal: Principal) -> Option<User> {
    state::with_users(|users| {
        users.get(&principal)
    })
}

#[ic_cdk::query]
pub fn get_current_user() -> Option<User> {
    let caller = caller();
    state::with_users(|users| {
        users.get(&caller)
    })
}

#[ic_cdk::query]
pub fn get_all_users() -> Vec<User> {
    state::with_users(|users| {
        users.iter().map(|(_, user)| user).collect()
    })
}

// Channel management
#[ic_cdk::update]
pub fn create_channel(request: CreateChannelRequest) -> Result<Channel, ChatError> {
    let caller = caller();
    
    if request.name.trim().is_empty() || request.name.len() > 100 {
        return Err(ChatError::InvalidInput);
    }
    
    // Ensure user is registered
    let user_exists = state::with_users(|users| {
        users.get(&caller).is_some()
    });
    
    if !user_exists {
        return Err(ChatError::NotAuthorized);
    }
    
    let channel_id = state::next_channel_id();
    let current_time = time();
    
    let channel = Channel {
        id: channel_id,
        name: request.name.trim().to_string(),
        description: request.description.map(|d| d.trim().to_string()).filter(|d| !d.is_empty()),
        created_by: caller,
        created_at: current_time,
        members: vec![caller],
        message_count: 0,
        last_message_at: None,
    };
    
    state::with_channels_mut(|channels| {
        channels.insert(channel_id, channel.clone());
    });
    
    Ok(channel)
}

#[ic_cdk::query]
pub fn get_channel(channel_id: u64) -> Option<Channel> {
    state::with_channels(|channels| {
        channels.get(&channel_id)
    })
}

#[ic_cdk::query]
pub fn get_all_channels() -> Vec<Channel> {
    state::with_channels(|channels| {
        channels.iter().map(|(_, channel)| channel).collect()
    })
}

#[ic_cdk::update]
pub fn join_channel(channel_id: u64) -> Result<(), ChatError> {
    let caller = caller();
    
    // Ensure user is registered
    let user_exists = state::with_users(|users| {
        users.get(&caller).is_some()
    });
    
    if !user_exists {
        return Err(ChatError::NotAuthorized);
    }
    
    state::with_channels_mut(|channels| {
        match channels.get(&channel_id) {
            Some(mut channel) => {
                if !channel.members.contains(&caller) {
                    channel.members.push(caller);
                    channels.insert(channel_id, channel);
                }
                Ok(())
            }
            None => Err(ChatError::ChannelNotFound),
        }
    })
}

// Message management
#[ic_cdk::update]
pub fn send_message(request: CreateMessageRequest) -> Result<Message, ChatError> {
    let caller = caller();
    
    if request.content.trim().is_empty() || request.content.len() > 2000 {
        return Err(ChatError::InvalidInput);
    }
    
    // Check total attachment size
    let total_attachment_size: u64 = request.attachments.iter().map(|a| a.size).sum();
    if total_attachment_size > 10_000_000 { // 10MB limit
        return Err(ChatError::AttachmentTooLarge);
    }
    
    // Ensure user is registered
    let user_exists = state::with_users(|users| {
        users.get(&caller).is_some()
    });
    
    if !user_exists {
        return Err(ChatError::NotAuthorized);
    }
    
    // If channel_id is provided, ensure user is member of channel
    if let Some(channel_id) = request.channel_id {
        let is_member = state::with_channels(|channels| {
            channels.get(&channel_id)
                .map(|channel| channel.members.contains(&caller))
                .unwrap_or(false)
        });
        
        if !is_member {
            return Err(ChatError::NotAuthorized);
        }
    }
    
    let message_id = state::next_message_id();
    let current_time = time();
    
    let message = Message {
        id: message_id,
        author: caller,
        content: request.content.trim().to_string(),
        timestamp: current_time,
        reply_to: request.reply_to,
        message_type: request.message_type,
        attachments: request.attachments,
    };
    
    // Store the message
    state::with_messages_mut(|messages| {
        messages.insert(message_id, message.clone());
    });
    
    // Update user message count and last active
    state::with_users_mut(|users| {
        if let Some(mut user) = users.get(&caller) {
            user.message_count += 1;
            user.last_active = current_time;
            users.insert(caller, user);
        }
    });
    
    // Update channel last message time and count if applicable
    if let Some(channel_id) = request.channel_id {
        state::with_channels_mut(|channels| {
            if let Some(mut channel) = channels.get(&channel_id) {
                channel.message_count += 1;
                channel.last_message_at = Some(current_time);
                channels.insert(channel_id, channel);
            }
        });
    }
    
    Ok(message)
}

#[ic_cdk::query]
pub fn get_messages(
    channel_id: Option<u64>,
    limit: Option<u64>,
    offset: Option<u64>,
) -> PaginatedMessages {
    let limit = limit.unwrap_or(50).min(100);
    let offset = offset.unwrap_or(0);
    
    let all_messages: Vec<Message> = state::with_messages(|messages| {
        messages.iter()
            .map(|(_, message)| message)
            .filter(|_message| {
                if let Some(_cid) = channel_id {
                    // For channel messages, we'd need to track which messages belong to which channel
                    // For now, return all messages
                    true
                } else {
                    true
                }
            })
            .collect()
    });
    
    // Sort by timestamp descending (newest first)
    let mut sorted_messages = all_messages;
    sorted_messages.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    let total_count = sorted_messages.len() as u64;
    let has_more = (offset + limit) < total_count;
    
    // Apply pagination
    let paginated_messages: Vec<Message> = sorted_messages
        .into_iter()
        .skip(offset as usize)
        .take(limit as usize)
        .collect();
    
    // Convert to MessageWithAuthor
    let messages_with_author: Vec<MessageWithAuthor> = paginated_messages
        .into_iter()
        .map(|message| {
            let author_username = state::with_users(|users| {
                users.get(&message.author)
                    .map(|user| user.username.clone())
                    .unwrap_or_else(|| "Unknown User".to_string())
            });
            
            MessageWithAuthor {
                id: message.id,
                author: message.author,
                author_username,
                content: message.content,
                timestamp: message.timestamp,
                reply_to: message.reply_to,
                message_type: message.message_type,
                attachments: message.attachments,
            }
        })
        .collect();
    
    PaginatedMessages {
        messages: messages_with_author,
        total_count,
        has_more,
    }
}

#[ic_cdk::query]
pub fn get_message(message_id: u64) -> Option<MessageWithAuthor> {
    state::with_messages(|messages| {
        messages.get(&message_id).map(|message| {
            let author_username = state::with_users(|users| {
                users.get(&message.author)
                    .map(|user| user.username.clone())
                    .unwrap_or_else(|| "Unknown User".to_string())
            });
            
            MessageWithAuthor {
                id: message.id,
                author: message.author,
                author_username,
                content: message.content,
                timestamp: message.timestamp,
                reply_to: message.reply_to,
                message_type: message.message_type,
                attachments: message.attachments,
            }
        })
    })
}

// Stats and utility functions
#[ic_cdk::query]
pub fn get_stats() -> Vec<(String, u64)> {
    let user_count = state::with_users(|users| users.len());
    let message_count = state::with_messages(|messages| messages.len());
    let channel_count = state::with_channels(|channels| channels.len());
    
    vec![
        ("users".to_string(), user_count),
        ("messages".to_string(), message_count),
        ("channels".to_string(), channel_count),
    ]
}

// Initialize the canister
#[init]
fn init() {
    // Create a general channel
    let general_channel = Channel {
        id: 1,
        name: "General".to_string(),
        description: Some("Welcome to Chat Z! This is the main chat channel.".to_string()),
        created_by: Principal::anonymous(),
        created_at: time(),
        members: vec![],
        message_count: 0,
        last_message_at: None,
    };
    
    state::with_channels_mut(|channels| {
        channels.insert(1, general_channel);
    });
    
    // The next channel ID will be automatically managed by the next_channel_id() function
    // and will start at 2 since we just created channel 1
}

#[post_upgrade]
fn post_upgrade() {
    // Any post-upgrade logic can go here
}
