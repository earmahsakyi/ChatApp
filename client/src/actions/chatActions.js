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

export const setActiveChat = (chat) => (dispatch) => {
  dispatch({
    type: SET_ACTIVE_CHAT,
    payload: chat
  });
};

export const clearActiveChat = () => (dispatch) => {
  dispatch({ type: CLEAR_ACTIVE_CHAT });
};

export const loadConversations = (conversations) => (dispatch) => {
  dispatch({
    type: LOAD_CONVERSATIONS,
    payload: conversations
  });
};

export const loadMessages = (messages, hasMore = false, append = false) => (dispatch) => {
  dispatch({
    type: LOAD_MESSAGES,
    payload: { messages, hasMore, append }
  });
};

export const addMessage = (message) => (dispatch) => {
  dispatch({
    type: ADD_MESSAGE,
    payload: message
  });
};

export const messageSent = (message) => (dispatch) => {
  dispatch({
    type: MESSAGE_SENT,
    payload: message
  });
};

export const markMessagesRead = (senderId) => (dispatch) => {
  dispatch({
    type: MARK_MESSAGES_READ,
    payload: { senderId }
  });
};

export const setTyping = (userId) => (dispatch) => {
  dispatch({
    type: SET_TYPING,
    payload: { userId }
  });
};

export const clearTyping = (userId) => (dispatch) => {
  dispatch({
    type: CLEAR_TYPING,
    payload: { userId }
  });
};

export const updateOnlineUsers = (users) => (dispatch) => {
  dispatch({
    type: UPDATE_ONLINE_USERS,
    payload: users
  });
};

export const userConnected = (userId) => (dispatch) => {
  dispatch({
    type: USER_CONNECTED,
    payload: { userId }
  });
};

export const userDisconnected = (userId) => (dispatch) => {
  dispatch({
    type: USER_DISCONNECTED,
    payload: { userId }
  });
};

export const chatError = (error) => (dispatch) => {
  dispatch({
    type: CHAT_ERROR,
    payload: error
  });
};

export const clearChatErrors = () => (dispatch) => {
  dispatch({ type: CLEAR_CHAT_ERRORS });
};
