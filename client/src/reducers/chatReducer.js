import {
  SET_ACTIVE_CHAT,
  CLEAR_ACTIVE_CHAT,
  LOAD_CONVERSATIONS,
  LOAD_MESSAGES,
  ADD_MESSAGE,
  MESSAGE_SENT,
  MARK_MESSAGES_READ,
  SET_TYPING,
  CLEAR_TYPING,
  UPDATE_ONLINE_USERS,
  USER_CONNECTED,
  USER_DISCONNECTED,
  CHAT_ERROR,
  CLEAR_CHAT_ERRORS
} from '../actions/types.js';

const initialState = {
  conversations: [],
  activeChat: null,
  messages: [],
  onlineUsers: [], 
  typingUsers: [], 
  loading: false,
  error: null,
  hasMoreMessages: true
};

export default function chatReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case LOAD_CONVERSATIONS:
      return { ...state, conversations: payload, loading: false, error: null };

    case SET_ACTIVE_CHAT:
      return { ...state, activeChat: payload, messages: [], hasMoreMessages: true };

    case CLEAR_ACTIVE_CHAT:
      return { ...state, activeChat: null, messages: [], hasMoreMessages: true };

    case LOAD_MESSAGES:
      return {
        ...state,
        messages: payload.append
          ? [...payload.messages, ...state.messages]
          : payload.messages,
        hasMoreMessages: payload.hasMore,
        loading: false
      };

    case ADD_MESSAGE:
    case MESSAGE_SENT:
      if (
        state.activeChat &&
        (payload.sender === state.activeChat._id || payload.receiver === state.activeChat._id)
      ) {
        return { ...state, messages: [...state.messages, payload] };
      }

      const updatedConversations = state.conversations.map(conv => {
        if (conv._id === payload.sender || conv._id === payload.receiver) {
          return {
            ...conv,
            lastMessage: {
              content: payload.content,
              timestamp: payload.timestamp,
              sender: payload.sender
            },
            unreadCount:
              conv._id === payload.sender && payload.receiver !== state.activeChat?._id
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount || 0
          };
        }
        return conv;
      });

      return { ...state, conversations: updatedConversations };

    case MARK_MESSAGES_READ:
      return {
        ...state,
        messages: state.messages.map(msg =>
          msg.sender === payload.senderId && !msg.read ? { ...msg, read: true } : msg
        ),
        conversations: state.conversations.map(conv =>
          conv._id === payload.senderId ? { ...conv, unreadCount: 0 } : conv
        )
      };

    case SET_TYPING:
      return {
        ...state,
        typingUsers: Array.from(new Set([...state.typingUsers, payload.userId]))
      };

    case CLEAR_TYPING:
      return {
        ...state,
        typingUsers: state.typingUsers.filter(id => id !== payload.userId)
      };

    case UPDATE_ONLINE_USERS:
      return {
        ...state,
        onlineUsers: Array.from(new Set(payload))
      };

    case USER_CONNECTED:
      return {
        ...state,
        onlineUsers: Array.from(new Set([...state.onlineUsers, payload.userId]))
      };

    case USER_DISCONNECTED:
      return {
        ...state,
        onlineUsers: state.onlineUsers.filter(id => id !== payload.userId)
      };

    case CHAT_ERROR:
      return { ...state, error: payload, loading: false };

    case CLEAR_CHAT_ERRORS:
      return { ...state, error: null };

    default:
      return state;
  }
}