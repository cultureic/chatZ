import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Attachment {
  'data' : Uint8Array | number[],
  'size' : bigint,
  'file_type' : string,
  'filename' : string,
}
export interface Channel {
  'id' : bigint,
  'members' : Array<Principal>,
  'name' : string,
  'description' : [] | [string],
  'last_message_at' : [] | [bigint],
  'created_at' : bigint,
  'created_by' : Principal,
  'message_count' : bigint,
  'is_encrypted' : boolean,
  'password_hash' : [] | [string],
}
export type ChatError = { 'UserAlreadyExists' : null } |
  { 'MessageTooLarge' : null } |
  { 'InvalidInput' : null } |
  { 'ChannelNotFound' : null } |
  { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AttachmentTooLarge' : null } |
  { 'InvalidPassword' : null };
export interface CreateChannelRequest {
  'name' : string,
  'description' : [] | [string],
}
export interface CreateMessageRequest {
  'channel_id' : [] | [bigint],
  'content' : string,
  'reply_to' : [] | [bigint],
  'message_type' : MessageType,
  'attachments' : Array<Attachment>,
}
export interface EncryptedMessage {
  'id' : bigint,
  'channel_id' : [] | [bigint],
  'reply_to' : [] | [bigint],
  'encrypted_content' : string,
  'author' : Principal,
  'timestamp' : bigint,
  'message_type' : MessageType,
  'shared_with' : Array<Principal>,
  'expires_at' : bigint,
  'attachments' : Array<Attachment>,
}
export interface Message {
  'id' : bigint,
  'content' : string,
  'reply_to' : [] | [bigint],
  'author' : Principal,
  'timestamp' : bigint,
  'message_type' : MessageType,
  'attachments' : Array<Attachment>,
}
export type MessageType = { 'System' : null } |
  { 'Text' : null } |
  { 'Image' : null };
export interface MessageWithAuthor {
  'id' : bigint,
  'content' : string,
  'reply_to' : [] | [bigint],
  'author' : Principal,
  'timestamp' : bigint,
  'author_username' : string,
  'message_type' : MessageType,
  'attachments' : Array<Attachment>,
}
export interface PaginatedMessages {
  'messages' : Array<MessageWithAuthor>,
  'total_count' : bigint,
  'has_more' : boolean,
}
export interface Stats {
  'messages' : bigint,
  'channels' : bigint,
  'users' : bigint,
}
export interface UpdateUserRequest {
  'bio' : [] | [string],
  'username' : [] | [string],
  'avatar_url' : [] | [string],
}
export interface User {
  'bio' : [] | [string],
  'encrypted_keys' : Array<[string, string]>,
  'user_principal' : Principal,
  'username' : string,
  'avatar_url' : [] | [string],
  'last_active' : bigint,
  'message_count' : bigint,
  'joined_at' : bigint,
}
export interface _SERVICE {
  'cleanup_expired_messages' : ActorMethod<[], bigint>,
  'create_channel' : ActorMethod<
    [CreateChannelRequest],
    { 'Ok' : Channel } |
      { 'Err' : ChatError }
  >,
  'create_encrypted_channel' : ActorMethod<
    [string, [] | [string], [] | [string]],
    { 'Ok' : Channel } |
      { 'Err' : ChatError }
  >,
  'create_encrypted_message' : ActorMethod<
    [string, [] | [bigint], [] | [bigint], MessageType, Array<Attachment>],
    { 'Ok' : bigint } |
      { 'Err' : ChatError }
  >,
  'decrypt_all_messages_from_channel' : ActorMethod<
    [bigint],
    Array<MessageWithAuthor>
  >,
  'decrypt_encrypted_message' : ActorMethod<
    [bigint],
    { 'Ok' : string } |
      { 'Err' : string }
  >,
  'delete_encrypted_message' : ActorMethod<
    [bigint],
    { 'Ok' : null } |
      { 'Err' : ChatError }
  >,
  'encrypted_symmetric_key_for_message' : ActorMethod<
    [bigint],
    { 'Ok' : Uint8Array | number[] } |
      { 'Err' : string }
  >,
  'fix_general_channel' : ActorMethod<
    [],
    { 'Ok' : Channel } |
      { 'Err' : ChatError }
  >,
  'get_all_channels' : ActorMethod<[], Array<Channel>>,
  'get_all_users' : ActorMethod<[], Array<User>>,
  'get_channel' : ActorMethod<[bigint], [] | [Channel]>,
  'get_current_user' : ActorMethod<[], [] | [User]>,
  'get_encrypted_messages' : ActorMethod<[], Array<EncryptedMessage>>,
  'get_encrypted_messages_from_channel' : ActorMethod<
    [bigint],
    Array<EncryptedMessage>
  >,
  'get_message' : ActorMethod<[bigint], [] | [MessageWithAuthor]>,
  'get_messages' : ActorMethod<
    [[] | [bigint], [] | [bigint], [] | [bigint]],
    PaginatedMessages
  >,
  'get_stats' : ActorMethod<[], Array<[string, bigint]>>,
  'get_user' : ActorMethod<[Principal], [] | [User]>,
  'join_channel' : ActorMethod<
    [bigint],
    { 'Ok' : null } |
      { 'Err' : ChatError }
  >,
  'register_user' : ActorMethod<
    [string, [] | [string]],
    { 'Ok' : User } |
      { 'Err' : ChatError }
  >,
  'send_message' : ActorMethod<
    [CreateMessageRequest],
    { 'Ok' : Message } |
      { 'Err' : ChatError }
  >,
  'share_encrypted_message' : ActorMethod<
    [bigint, Principal],
    { 'Ok' : null } |
      { 'Err' : ChatError }
  >,
  'symmetric_key_verification_key_for_encrypted_message' : ActorMethod<
    [],
    { 'Ok' : Uint8Array | number[] } |
      { 'Err' : string }
  >,
  'update_user' : ActorMethod<
    [UpdateUserRequest],
    { 'Ok' : User } |
      { 'Err' : ChatError }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
