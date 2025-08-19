export const idlFactory = ({ IDL }) => {
  const CreateChannelRequest = IDL.Record({
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
  });
  const Channel = IDL.Record({
    'id' : IDL.Nat64,
    'members' : IDL.Vec(IDL.Principal),
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'last_message_at' : IDL.Opt(IDL.Nat64),
    'created_at' : IDL.Nat64,
    'created_by' : IDL.Principal,
    'message_count' : IDL.Nat64,
  });
  const ChatError = IDL.Variant({
    'UserAlreadyExists' : IDL.Null,
    'MessageTooLarge' : IDL.Null,
    'InvalidInput' : IDL.Null,
    'ChannelNotFound' : IDL.Null,
    'NotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'AttachmentTooLarge' : IDL.Null,
  });
  const User = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'user_principal' : IDL.Principal,
    'username' : IDL.Text,
    'avatar_url' : IDL.Opt(IDL.Text),
    'last_active' : IDL.Nat64,
    'message_count' : IDL.Nat64,
    'joined_at' : IDL.Nat64,
  });
  const MessageType = IDL.Variant({
    'System' : IDL.Null,
    'Text' : IDL.Null,
    'Image' : IDL.Null,
  });
  const Attachment = IDL.Record({
    'data' : IDL.Vec(IDL.Nat8),
    'size' : IDL.Nat64,
    'file_type' : IDL.Text,
    'filename' : IDL.Text,
  });
  const MessageWithAuthor = IDL.Record({
    'id' : IDL.Nat64,
    'content' : IDL.Text,
    'reply_to' : IDL.Opt(IDL.Nat64),
    'author' : IDL.Principal,
    'timestamp' : IDL.Nat64,
    'author_username' : IDL.Text,
    'message_type' : MessageType,
    'attachments' : IDL.Vec(Attachment),
  });
  const PaginatedMessages = IDL.Record({
    'messages' : IDL.Vec(MessageWithAuthor),
    'total_count' : IDL.Nat64,
    'has_more' : IDL.Bool,
  });
  const CreateMessageRequest = IDL.Record({
    'channel_id' : IDL.Opt(IDL.Nat64),
    'content' : IDL.Text,
    'reply_to' : IDL.Opt(IDL.Nat64),
    'message_type' : MessageType,
    'attachments' : IDL.Vec(Attachment),
  });
  const Message = IDL.Record({
    'id' : IDL.Nat64,
    'content' : IDL.Text,
    'reply_to' : IDL.Opt(IDL.Nat64),
    'author' : IDL.Principal,
    'timestamp' : IDL.Nat64,
    'message_type' : MessageType,
    'attachments' : IDL.Vec(Attachment),
  });
  const UpdateUserRequest = IDL.Record({
    'bio' : IDL.Opt(IDL.Text),
    'username' : IDL.Opt(IDL.Text),
    'avatar_url' : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    'create_channel' : IDL.Func(
        [CreateChannelRequest],
        [IDL.Variant({ 'Ok' : Channel, 'Err' : ChatError })],
        [],
      ),
    'get_all_channels' : IDL.Func([], [IDL.Vec(Channel)], ['query']),
    'get_all_users' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'get_channel' : IDL.Func([IDL.Nat64], [IDL.Opt(Channel)], ['query']),
    'get_current_user' : IDL.Func([], [IDL.Opt(User)], ['query']),
    'get_message' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(MessageWithAuthor)],
        ['query'],
      ),
    'get_messages' : IDL.Func(
        [IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat64), IDL.Opt(IDL.Nat64)],
        [PaginatedMessages],
        ['query'],
      ),
    'get_stats' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat64))],
        ['query'],
      ),
    'get_user' : IDL.Func([IDL.Principal], [IDL.Opt(User)], ['query']),
    'join_channel' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ChatError })],
        [],
      ),
    'register_user' : IDL.Func(
        [IDL.Text, IDL.Opt(IDL.Text)],
        [IDL.Variant({ 'Ok' : User, 'Err' : ChatError })],
        [],
      ),
    'send_message' : IDL.Func(
        [CreateMessageRequest],
        [IDL.Variant({ 'Ok' : Message, 'Err' : ChatError })],
        [],
      ),
    'update_user' : IDL.Func(
        [UpdateUserRequest],
        [IDL.Variant({ 'Ok' : User, 'Err' : ChatError })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
