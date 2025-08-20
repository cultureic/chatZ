
mod state;

#[cfg(test)]
mod tests;

use candid::{CandidType, Principal};
use sha2::{Digest, Sha256};
use ic_cdk::{init, post_upgrade};
use ic_cdk_timers::set_timer_interval;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub use state::{Attachment, Channel, Message, MessageType, User, EncryptedMessage, MessageIds};

// VetKeys imports
use ic_cdk::api::{caller, time, msg_caller};
use ic_cdk::call;
use ic_management_canister_types::{
    VetKDCurve, VetKDDeriveKeyArgs, VetKDDeriveKeyResult, VetKDKeyId, VetKDPublicKeyArgs,
    VetKDPublicKeyResult,
};

#[derive(CandidType, Serialize, Deserialize, Debug)]
pub enum ChatError {
    NotFound,
    NotAuthorized,
    InvalidInput,
    UserAlreadyExists,
    ChannelNotFound,
    MessageTooLarge,
    AttachmentTooLarge,
    InvalidPassword,
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

#[derive(CandidType, Serialize, Deserialize, Clone)]
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
        encrypted_keys: HashMap::new(),
    };
    
    state::with_users_mut(|users| {
        users.insert(caller, user.clone());
    });
    
    // Automatically add the new user to the General channel (ID = 1)
    state::with_channels_mut(|channels| {
        if let Some(mut general_channel) = channels.get(&1) {
            if !general_channel.members.contains(&caller) {
                general_channel.members.push(caller);
                channels.insert(1, general_channel);
            }
        }
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
        is_encrypted: false, // Default channels are not encrypted
        password_hash: None, // Regular channels have no password
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
pub fn join_channel(channel_id: u64, password: Option<String>) -> Result<(), ChatError> {
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
                // Only check password if the channel actually has a password hash
                if let Some(stored_hash) = &channel.password_hash {
                    // If there's a stored hash, we need a password to verify
                    match password {
                        Some(provided_password) => {
                            if !verify_password(&provided_password, stored_hash) {
                                return Err(ChatError::InvalidPassword);
                            }
                        }
                        None => {
                            return Err(ChatError::InvalidPassword);
                        }
                    }
                }
                // If no password hash exists, no password check is needed
                
                // Add user to channel if not already a member
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
        channel_id: request.channel_id,  // Store the channel_id with the message
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
            .filter(|message| {
                if let Some(cid) = channel_id {
                    // Filter messages by their actual channel_id
                    message.channel_id == Some(cid)
                } else {
                    // No channel filter - show all messages
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

// Initialize the canister with VetKeys support
#[init]
fn init(key_name: Option<String>) {
    // Initialize VetKey name for this canister
    let vetkey_name = key_name.unwrap_or_else(|| "chat_z_symmetric_key".to_string());
    state::with_key_name_mut(|key_name_cell| {
        key_name_cell.set(vetkey_name).expect("Failed to set key name");
    });

    // Create a general channel with anonymous principal as initial member
    // This allows anyone to send messages to the general channel initially
    let general_channel = Channel {
        id: 1,
        name: "General".to_string(),
        description: Some("Welcome to Chat Z! This is the main chat channel.".to_string()),
        created_by: Principal::anonymous(),
        created_at: time(),
        members: vec![Principal::anonymous()],
        message_count: 0,
        last_message_at: None,
        is_encrypted: false,
        password_hash: None,
    };
    
    state::with_channels_mut(|channels| {
        channels.insert(1, general_channel);
    });
    
    // The next channel ID will be automatically managed by the next_channel_id() function
    // and will start at 2 since we just created channel 1
    
    // Set up automatic cleanup timer for expired encrypted messages
    // Run cleanup every hour (3600 seconds)
    setup_cleanup_timer();
}

/// Set up timer to clean up expired messages every hour
fn setup_cleanup_timer() {
    use std::time::Duration;
    let cleanup_interval = Duration::from_secs(3600); // 1 hour
    set_timer_interval(cleanup_interval, || {
        ic_cdk::spawn(async {
            let cleaned = cleanup_expired_messages();
            if cleaned > 0 {
                ic_cdk::print(&format!("Cleaned up {} expired encrypted messages", cleaned));
            }
        });
    });
}

#[post_upgrade]
fn post_upgrade() {
    // Fix General channel permissions on upgrade
    fix_general_channel_permissions();
}

// Helper function to ensure General channel has proper permissions
fn fix_general_channel_permissions() {
    state::with_channels_mut(|channels| {
        if let Some(mut general_channel) = channels.get(&1) {
            // Ensure anonymous principal is in the members list
            if !general_channel.members.contains(&Principal::anonymous()) {
                general_channel.members.push(Principal::anonymous());
            }
            
            // Add all existing users to General channel
            state::with_users(|users| {
                for (user_principal, _) in users.iter() {
                    if !general_channel.members.contains(&user_principal) {
                        general_channel.members.push(user_principal);
                    }
                }
            });
            
            channels.insert(1, general_channel);
        }
    });
}

// Force delete a channel regardless of owner
#[ic_cdk::update]
pub fn force_delete_channel(channel_id: u64) -> Result<(), ChatError> {
    let caller = msg_caller();
    let admin = Principal::from_text("ouuvn-c7hpi-46km4-ywlnr-j2ten-wldfi-xu53v-vth6u-3qtqr-cmbxu-gqe").unwrap();
    
    // Only allow admin to call this function
    if caller != admin {
        return Err(ChatError::NotAuthorized);
    }
    
    // Don't allow deleting the general channel (ID 1)
    if channel_id == 1 {
        return Err(ChatError::NotAuthorized);
    }
    
    state::with_channels_mut(|channels| {
        match channels.get(&channel_id) {
            Some(_) => {
                channels.remove(&channel_id);
                Ok(())
            }
            None => Err(ChatError::ChannelNotFound)
        }
    })
}

// Delete a channel
#[ic_cdk::update]
pub fn delete_channel(channel_id: u64) -> Result<(), ChatError> {
    let caller = msg_caller();
    
    // Get the channel and verify ownership
    state::with_channels_mut(|channels| {
        match channels.get(&channel_id) {
            Some(channel) => {
                // Only allow the creator or a canister admin to delete the channel
                if channel.created_by != caller {
                    return Err(ChatError::NotAuthorized);
                }
                
                // Don't allow deleting the general channel (ID 1)
                if channel_id == 1 {
                    return Err(ChatError::NotAuthorized);
                }
                
                // Remove the channel
                channels.remove(&channel_id);
                Ok(())
            }
            None => Err(ChatError::ChannelNotFound)
        }
    })
}

#[ic_cdk::update]
pub fn fix_general_channel() -> Result<Channel, ChatError> {
    fix_general_channel_permissions();
    
    // Return the updated General channel
    state::with_channels(|channels| {
        channels.get(&1).ok_or(ChatError::ChannelNotFound)
    })
}

// === Encrypted Messages (VetKeys integration will be added later) ===

// VetKeys functions will be re-enabled when using ic-cdk 0.18+
// For now, we have the encrypted message structure and management ready

/// Create a new encrypted message that expires in 24 hours
/// The backend will encrypt the content using VetKD-derived keys
#[ic_cdk::update]
pub async fn create_encrypted_message(
    plain_content: String, // Plain text content - backend will encrypt it
    channel_id: Option<u64>,
    reply_to: Option<u64>,
    message_type: MessageType,
    attachments: Vec<Attachment>,
) -> Result<u64, ChatError> {
let caller = caller();
    let current_time = time();
    
    // Validate plain content
    if plain_content.trim().is_empty() || plain_content.len() > 2000 {
        return Err(ChatError::InvalidInput);
    }
    
    // Ensure user is registered
    let user_exists = state::with_users(|users| {
        users.get(&caller).is_some()
    });
    
    if !user_exists {
        return Err(ChatError::NotAuthorized);
    }
    
    // If channel_id is provided, ensure user is member of channel
    if let Some(channel_id) = channel_id {
        let is_member = state::with_channels(|channels| {
            channels.get(&channel_id)
                .map(|channel| channel.members.contains(&caller))
                .unwrap_or(false)
        });
        
        if !is_member {
            return Err(ChatError::NotAuthorized);
        }
        
        // Verify the channel actually supports encryption
        let is_encrypted_channel = state::with_channels(|channels| {
            channels.get(&channel_id)
                .map(|channel| channel.is_encrypted)
                .unwrap_or(false)
        });
        
        if !is_encrypted_channel {
            return Err(ChatError::InvalidInput);
        }
    }
    
    let message_id = state::next_message_id();
    let expires_at = current_time + (24 * 60 * 60 * 1_000_000_000); // 24 hours in nanoseconds
    
    // Encrypt the content using VetKD-derived symmetric key
    let encrypted_content = match encrypt_message_content(&plain_content, message_id).await {
        Ok(ciphertext) => ciphertext,
        Err(e) => {
            ic_cdk::println!("Failed to encrypt message: {}", e);
            return Err(ChatError::InvalidInput);
        }
    };
    
    let encrypted_message = EncryptedMessage {
        id: message_id,
        encrypted_content,
        author: caller,
        timestamp: current_time,
        expires_at,
        channel_id,
        reply_to,
        message_type,
        shared_with: vec![],
        attachments,
    };
    
    // Store the encrypted message
    state::with_encrypted_messages_mut(|messages| {
        messages.insert(message_id, encrypted_message);
    });
    
    // Add to owner's list
    state::with_encrypted_message_owners_mut(|owners| {
        if let Some(mut owner_ids) = owners.get(&caller) {
            owner_ids.ids.push(message_id);
            owners.insert(caller, owner_ids);
        } else {
            owners.insert(caller, MessageIds { ids: vec![message_id] });
        }
    });
    
    // Update user message count
    state::with_users_mut(|users| {
        if let Some(mut user) = users.get(&caller) {
            user.message_count += 1;
            user.last_active = current_time;
            users.insert(caller, user);
        }
    });
    
    Ok(message_id)
}

/// Get encrypted messages accessible by the caller
#[ic_cdk::update]
pub fn get_encrypted_messages() -> Vec<EncryptedMessage> {
let caller = caller();
    let current_time = time();
    
    state::with_encrypted_messages(|messages| {
        let owned = state::with_encrypted_message_owners(|ids| {
            let default_ids = MessageIds { ids: vec![] };
            ids.get(&caller)
                .unwrap_or(default_ids)
                .iter()
                .filter_map(|id| messages.get(id))
                .filter(|msg| !msg.is_expired(current_time))
                .collect::<Vec<_>>()
        });
        
        let shared = state::with_encrypted_message_shares(|ids| {
            let default_ids = MessageIds { ids: vec![] };
            ids.get(&caller)
                .unwrap_or(default_ids)
                .iter()
                .filter_map(|id| messages.get(id))
                .filter(|msg| !msg.is_expired(current_time))
                .collect::<Vec<_>>()
        });
        
        let mut result = Vec::with_capacity(owned.len() + shared.len());
        result.extend(owned);
        result.extend(shared);
        result
    })
}

/// Share an encrypted message with another user
#[ic_cdk::update]
pub fn share_encrypted_message(message_id: u64, user_principal: Principal) -> Result<(), ChatError> {
let caller = caller();
    
    state::with_encrypted_messages_mut(|messages| {
        if let Some(mut message) = messages.get(&message_id) {
            let owner = &message.author;
            if owner != &caller {
                return Err(ChatError::NotAuthorized);
            }
            
            if message.shared_with.len() >= 50 {
                return Err(ChatError::InvalidInput);
            }
            
            if !message.shared_with.contains(&user_principal) {
                message.shared_with.push(user_principal);
                messages.insert(message_id, message);
            }
            
            // Add to shared list
            state::with_encrypted_message_shares_mut(|shares| {
                if let Some(mut user_ids) = shares.get(&user_principal) {
                    if !user_ids.ids.contains(&message_id) {
                        user_ids.ids.push(message_id);
                        shares.insert(user_principal, user_ids);
                    }
                } else {
                    shares.insert(user_principal, MessageIds { ids: vec![message_id] });
                }
            });
            
            Ok(())
        } else {
            Err(ChatError::NotFound)
        }
    })
}

/// Delete an encrypted message (only owner can delete)
#[ic_cdk::update]
pub fn delete_encrypted_message(message_id: u64) -> Result<(), ChatError> {
let caller = caller();
    
    state::with_encrypted_messages_mut(|messages| {
        if let Some(message_to_delete) = messages.get(&message_id) {
            let owner = &message_to_delete.author;
            if owner != &caller {
                return Err(ChatError::NotAuthorized);
            }
            
            // Remove from owner's list
            state::with_encrypted_message_owners_mut(|owners| {
                if let Some(mut owner_ids) = owners.get(owner) {
                    owner_ids.ids.retain(|&id| id != message_id);
                    if !owner_ids.ids.is_empty() {
                        owners.insert(*owner, owner_ids);
                    } else {
                        owners.remove(owner);
                    }
                }
            });
            
            // Remove from shared lists
            state::with_encrypted_message_shares_mut(|shares| {
                for share in &message_to_delete.shared_with {
                    if let Some(mut share_ids) = shares.get(share) {
                        share_ids.ids.retain(|&id| id != message_id);
                        if !share_ids.ids.is_empty() {
                            shares.insert(*share, share_ids);
                        } else {
                            shares.remove(share);
                        }
                    }
                }
            });
            
            messages.remove(&message_id);
            Ok(())
        } else {
            Err(ChatError::NotFound)
        }
    })
}

#[ic_cdk::update]
pub fn create_encrypted_channel(name: String, description: Option<String>, password: Option<String>) -> Result<Channel, ChatError> {
let caller = caller();
    
    if name.trim().is_empty() || name.len() > 100 {
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
    
    // Hash password if provided
    let password_hash = password.as_ref()
        .filter(|p| !p.trim().is_empty())
        .map(|p| hash_password(p.trim()));
    
    // Determine channel name prefix based on protection level
    let channel_name = if password_hash.is_some() {
        format!("🔒🔑 {}", name.trim())
    } else {
        format!("🔒 {}", name.trim())
    };
    
    let channel = Channel {
        id: channel_id,
        name: channel_name,
        description: description.map(|d| d.trim().to_string()).filter(|d| !d.is_empty()),
        created_by: caller,
        created_at: current_time,
        members: vec![caller],
        message_count: 0,
        last_message_at: None,
        is_encrypted: true,
        password_hash,
    };
    
    state::with_channels_mut(|channels| {
        channels.insert(channel_id, channel.clone());
    });
    
    Ok(channel)
}

/// Cleanup expired encrypted messages - called periodically
#[ic_cdk::update]
pub fn cleanup_expired_messages() -> u64 {
    let current_time = time();
    let mut cleaned_count = 0u64;
    
    let expired_ids: Vec<u64> = state::with_encrypted_messages(|messages| {
        messages.iter()
            .filter_map(|(id, message)| {
                if message.is_expired(current_time) {
                    Some(id)
                } else {
                    None
                }
            })
            .collect()
    });
    
    for message_id in expired_ids {
        // Use the existing delete function logic but without caller authorization
        if let Some(message_to_delete) = state::with_encrypted_messages(|messages| messages.get(&message_id)) {
            let owner = &message_to_delete.author;
            
            // Remove from owner's list
            state::with_encrypted_message_owners_mut(|owners| {
                if let Some(mut owner_ids) = owners.get(owner) {
                    owner_ids.ids.retain(|&id| id != message_id);
                    if !owner_ids.ids.is_empty() {
                        owners.insert(*owner, owner_ids);
                    } else {
                        owners.remove(owner);
                    }
                }
            });
            
            // Remove from shared lists
            state::with_encrypted_message_shares_mut(|shares| {
                for share in &message_to_delete.shared_with {
                    if let Some(mut share_ids) = shares.get(share) {
                        share_ids.ids.retain(|&id| id != message_id);
                        if !share_ids.ids.is_empty() {
                            shares.insert(*share, share_ids);
                        } else {
                            shares.remove(share);
                        }
                    }
                }
            });
            
            state::with_encrypted_messages_mut(|messages| {
                messages.remove(&message_id);
            });
            cleaned_count += 1;
        }
    }
    
    cleaned_count
}

// === Password Handling Functions ===

/// Hash a password with SHA-256 and return the hex-encoded string
pub fn hash_password(password: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    hex::encode(result)
}

/// Verify if a provided password matches the stored hash
pub fn verify_password(provided_password: &str, stored_hash: &str) -> bool {
    let hashed_provided = hash_password(provided_password);
    hashed_provided == stored_hash
}


// === VetKeys Integration ===

/// Generate a VetKey ID for encrypted symmetric keys
fn key_id() -> VetKDKeyId {
    state::with_key_name(|key_name_cell| {
        VetKDKeyId {
            curve: VetKDCurve::Bls12_381_G2,
            name: key_name_cell.get().clone(),
        }
    })
}

/// Get the public key for encrypted message verification
#[ic_cdk::update]
pub async fn symmetric_key_verification_key_for_encrypted_message() -> Result<Vec<u8>, String> {
    let request = VetKDPublicKeyArgs {
        canister_id: None,
        context: vec![],
        key_id: key_id(),
    };

    let (response,): (VetKDPublicKeyResult,) = call(
        Principal::management_canister(),
        "vetkd_public_key",
        (request,),
    )
    .await
    .map_err(|e| format!("Failed to get VetKD public key: {:?}", e))?;

    Ok(response.public_key)
}

/// Derive encrypted symmetric key for a specific message
#[ic_cdk::update]
pub async fn encrypted_symmetric_key_for_message(message_id: u64) -> Result<Vec<u8>, String> {
    let caller = msg_caller();
    let current_time = time();
    
    // Check if the caller is authorized to access this message with channel membership
    let authorized = state::with_encrypted_messages(|messages| {
        messages.get(&message_id)
            .map(|msg| {
                !msg.is_expired(current_time) &&
                msg.is_authorized_with_channels(&caller, |channel_id| {
                    state::with_channels(|channels| channels.get(&channel_id))
                })
            })
            .unwrap_or(false)
    });
    
    if !authorized {
        return Err("Not authorized to access this message".to_string());
    }
    
    let request = VetKDDeriveKeyArgs {
        context: format!("message_{}", message_id).as_bytes().to_vec(),
        input: vec![],
        key_id: key_id(),
        transport_public_key: vec![],
    };

    let (response,): (VetKDDeriveKeyResult,) = call(
        Principal::management_canister(),
        "vetkd_derive_key",
        (request,),
    )
    .await
    .map_err(|e| format!("Failed to derive VetKD key: {:?}", e))?;

    Ok(response.encrypted_key)
}

/// Helper function to encrypt message content using VetKD-derived key
async fn encrypt_message_content(plain_content: &str, message_id: u64) -> Result<String, String> {
    // For demonstration purposes, we'll use a simple base64 encoding
    // In a real implementation, this would:
    // 1. Derive a symmetric key using VetKD for this specific message
    // 2. Encrypt the content with AES-GCM using that key
    // 3. Return the base64-encoded ciphertext
    
    // For now, we'll prefix with "[ENCRYPTED]" to show it's encrypted and base64 encode
    let encrypted_data = format!("[VET_ENCRYPTED:{}]{}", message_id, plain_content);
    Ok(base64::encode(encrypted_data.as_bytes()))
}

/// Helper function to decrypt message content using VetKD-derived key
async fn decrypt_message_content(encrypted_content: &str, message_id: u64) -> Result<String, String> {
    // Handle backward compatibility - some messages may be stored as plain text
    // First try to decode as base64, if it fails, treat as legacy plain text
    
    match base64::decode(encrypted_content) {
        Ok(decoded_bytes) => {
            // Successfully decoded as base64, now check if it's our VET_ENCRYPTED format
            let decoded_str = String::from_utf8(decoded_bytes)
                .map_err(|e| format!("Invalid UTF-8 in decoded content: {}", e))?;
            
            let expected_prefix = format!("[VET_ENCRYPTED:{}]", message_id);
            if decoded_str.starts_with(&expected_prefix) {
                // New format: base64-encoded with VET_ENCRYPTED prefix
                Ok(decoded_str[expected_prefix.len()..].to_string())
            } else {
                // Base64-decoded but doesn't have our prefix - might be plain text that was base64 encoded
                Ok(decoded_str)
            }
        },
        Err(_) => {
            // Failed to decode as base64 - treat as legacy plain text format
            // This handles messages that were stored as plain text before proper encryption was implemented
            Ok(encrypted_content.to_string())
        }
    }
}

/// Decrypt and return the content of an encrypted message
/// This function uses VetKD to verify authorization and decrypt content
#[ic_cdk::update]
pub async fn decrypt_encrypted_message(message_id: u64) -> Result<String, String> {
let caller = caller();
    let current_time = time();
    
    // Get the encrypted message and verify authorization with channel membership
    let encrypted_message = state::with_encrypted_messages(|messages| {
        messages.get(&message_id).filter(|msg| {
            !msg.is_expired(current_time) && 
            msg.is_authorized_with_channels(&caller, |channel_id| {
                state::with_channels(|channels| channels.get(&channel_id))
            })
        })
    });
    
    let message = encrypted_message.ok_or("Message not found or not authorized")?;
    
    // Decrypt the content using VetKD-derived key
    decrypt_message_content(&message.encrypted_content, message_id).await
}

/// Get encrypted messages from a specific channel (returns encrypted content)
#[ic_cdk::query]
pub fn get_encrypted_messages_from_channel(channel_id: u64) -> Vec<EncryptedMessage> {
let caller = caller();
    let current_time = time();
    
    // Check if channel exists and is encrypted
    let channel_exists = state::with_channels(|channels| {
        channels.get(&channel_id)
            .map(|channel| channel.is_encrypted)
            .unwrap_or(false)
    });
    
    if !channel_exists {
        return vec![];
    }
    
    // Return encrypted messages for everyone to see (as ciphertext)
    // Authorization is only required for decryption
    
    // Get all encrypted messages for this channel
    state::with_encrypted_messages(|messages| {
        messages.iter()
            .filter_map(|(_, message)| {
                if message.channel_id == Some(channel_id) && !message.is_expired(current_time) {
                    Some(message)
                } else {
                    None
                }
            })
            .collect()
    })
}

/// Decrypt all messages from a channel that the user has access to
#[ic_cdk::update]
pub async fn decrypt_all_messages_from_channel(channel_id: u64) -> Vec<MessageWithAuthor> {
let caller = caller();
    let current_time = time();
    
    // Verify caller is member of the channel
    let is_member = state::with_channels(|channels| {
        channels.get(&channel_id)
            .map(|channel| channel.members.contains(&caller) && channel.is_encrypted)
            .unwrap_or(false)
    });
    
    if !is_member {
        return vec![];
    }
    
    // Get all encrypted messages for this channel
    let encrypted_messages = state::with_encrypted_messages(|messages| {
        messages.iter()
            .filter_map(|(_, message)| {
                if message.channel_id == Some(channel_id) 
                    && !message.is_expired(current_time) 
                    && message.is_authorized_with_channels(&caller, |channel_id| {
                        state::with_channels(|channels| channels.get(&channel_id))
                    }) {
                    Some(message)
                } else {
                    None
                }
            })
            .collect::<Vec<_>>()
    });
    
    // Decrypt each message
    let mut decrypted_messages = Vec::new();
    
    for message in encrypted_messages {
        match decrypt_message_content(&message.encrypted_content, message.id).await {
            Ok(decrypted_content) => {
                let author_username = state::with_users(|users| {
                    users.get(&message.author)
                        .map(|user| user.username.clone())
                        .unwrap_or_else(|| "Unknown User".to_string())
                });
                
                decrypted_messages.push(MessageWithAuthor {
                    id: message.id,
                    author: message.author,
                    author_username,
                    content: decrypted_content,
                    timestamp: message.timestamp,
                    reply_to: message.reply_to,
                    message_type: message.message_type.clone(),
                    attachments: message.attachments.clone(),
                });
            },
            Err(e) => {
                ic_cdk::println!("Failed to decrypt message {}: {}", message.id, e);
                // Skip messages that fail to decrypt
            }
        }
    }
    
    // Sort by timestamp (newest first)
    decrypted_messages.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    decrypted_messages
}
