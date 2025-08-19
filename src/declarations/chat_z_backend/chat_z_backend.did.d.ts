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
}
export type ChatError = { 'UserAlreadyExists' : null } |
  { 'MessageTooLarge' : null } |
  { 'InvalidInput' : null } |
  { 'ChannelNotFound' : null } |
  { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AttachmentTooLarge' : null };
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
  'user_principal' : Principal,
  'username' : string,
  'avatar_url' : [] | [string],
  'last_active' : bigint,
  'message_count' : bigint,
  'joined_at' : bigint,
}
export interface _SERVICE {
  'create_channel' : ActorMethod<
    [CreateChannelRequest],
    { 'Ok' : Channel } |
      { 'Err' : ChatError }
  >,
  'get_all_channels' : ActorMethod<[], Array<Channel>>,
  'get_all_users' : ActorMethod<[], Array<User>>,
  'get_channel' : ActorMethod<[bigint], [] | [Channel]>,
  'get_current_user' : ActorMethod<[], [] | [User]>,
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
  'update_user' : ActorMethod<
    [UpdateUserRequest],
    { 'Ok' : User } |
      { 'Err' : ChatError }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
