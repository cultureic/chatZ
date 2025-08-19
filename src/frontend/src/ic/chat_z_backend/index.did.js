export const idlFactory = ({ IDL }) => {
  const MessageType = IDL.Variant({
    'Text' : IDL.Null,
    'Image' : IDL.Null,
    'System' : IDL.Null,
  });
  const Attachment = IDL.Record({
    'file_type' : IDL.Text,
    'data' : IDL.Vec(IDL.Nat8),
    'filename' : IDL.Text,
    'size' : IDL.Nat64,
  });
  const CreateMessageRequest = IDL.Record({
    'content' : IDL.Text,
    'channel_id' : IDL.Opt(IDL.Nat64),
    'reply_to' : IDL.Opt(IDL.Nat64),
    'message_type' : MessageType,
    'attachments' : IDL.Vec(Attachment),
  });
  const Message = IDL.Record({
    'id' : IDL.Nat64,
    'author' : IDL.Principal,
    'content' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'reply_to' : IDL.Opt(IDL.Nat64),
    'message_type' : MessageType,
    'attachments' : IDL.Vec(Attachment),
  });
  const ChatError = IDL.Variant({
    'NotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidInput' : IDL.Null,
    'UserAlreadyExists' : IDL.Null,
    'ChannelNotFound' : IDL.Null,
    'MessageTooLarge' : IDL.Null,
    'AttachmentTooLarge' : IDL.Null,
  });
  const Result = IDL.Variant({ 'Ok' : Message, 'Err' : ChatError });
  const CreateChannelRequest = IDL.Record({
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
  });
  const Channel = IDL.Record({
    'id' : IDL.Nat64,
    'name' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
    'created_by' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'members' : IDL.Vec(IDL.Principal),
    'message_count' : IDL.Nat64,
    'last_message_at' : IDL.Opt(IDL.Nat64),
  });
  const Result_1 = IDL.Variant({ 'Ok' : Channel, 'Err' : ChatError });
  const MessageWithAuthor = IDL.Record({
    'id' : IDL.Nat64,
    'author' : IDL.Principal,
    'author_username' : IDL.Text,
    'content' : IDL.Text,
    'timestamp' : IDL.Nat64,
    'reply_to' : IDL.Opt(IDL.Nat64),
    'message_type' : MessageType,
    'attachments' : IDL.Vec(Attachment),
  });
  const PaginatedMessages = IDL.Record({
    'messages' : IDL.Vec(MessageWithAuthor),
    'total_count' : IDL.Nat64,
    'has_more' : IDL.Bool,
  });
  const Result_2 = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ChatError });
  const User = IDL.Record({
    'principal' : IDL.Principal,
    'username' : IDL.Text,
    'avatar_url' : IDL.Opt(IDL.Text),
    'bio' : IDL.Opt(IDL.Text),
    'joined_at' : IDL.Nat64,
    'message_count' : IDL.Nat64,
    'last_active' : IDL.Nat64,
  });
  const Result_3 = IDL.Variant({ 'Ok' : User, 'Err' : ChatError });
  const UpdateUserRequest = IDL.Record({
    'username' : IDL.Opt(IDL.Text),
    'bio' : IDL.Opt(IDL.Text),
    'avatar_url' : IDL.Opt(IDL.Text),
  });
  return IDL.Service({
    'create_channel' : IDL.Func([CreateChannelRequest], [Result_1], []),
    'get_all_channels' : IDL.Func([], [IDL.Vec(Channel)], ['query']),
    'get_all_users' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'get_channel' : IDL.Func([IDL.Nat64], [IDL.Opt(Channel)], ['query']),
    'get_current_user' : IDL.Func([], [IDL.Opt(User)], ['query']),
    'get_message' : IDL.Func([IDL.Nat64], [IDL.Opt(MessageWithAuthor)], ['query']),
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
    'join_channel' : IDL.Func([IDL.Nat64], [Result_2], []),
    'register_user' : IDL.Func([IDL.Text, IDL.Opt(IDL.Text)], [Result_3], []),
    'send_message' : IDL.Func([CreateMessageRequest], [Result], []),
    'update_user' : IDL.Func([UpdateUserRequest], [Result_3], []),
  });
};
export const init = ({ IDL }) => { return []; };
