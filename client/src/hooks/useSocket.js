// Fixed useSocket.js - Add proper cleanup and connection handling
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import io from 'socket.io-client';
import {
  loadConversations,
  loadMessages,
  addMessage,
  messageSent,
  setTyping,
  clearTyping,
  updateOnlineUsers,
  userConnected,
  userDisconnected,
  chatError
} from '../actions/chatActions';

const useSocket = () => {
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      socketRef.current = io('http://localhost:5000', {
        auth: { token },
        forceNew: true, // Force new connection on refresh
        transports: ['websocket', 'polling']
      });

      const socket = socketRef.current;

      // Connection events
      socket.on('connect', () => {
        console.log('Connected to server');
        // Emit user online status immediately after connection
        socket.emit('user_online', user._id);
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason);
      });

      // User online/offline events
      socket.on('online_users', (users) => {
        dispatch(updateOnlineUsers(users));
      });

      socket.on('user_connected', (userId) => {
        dispatch(userConnected(userId));
      });

      socket.on('user_disconnected', (userId) => {
        dispatch(userDisconnected(userId));
      });

      // Message events
      socket.on('receive_message', (messageData) => {
        dispatch(addMessage(messageData));
      });

      socket.on('message_sent', (messageData) => {
        dispatch(messageSent(messageData));
      });

      socket.on('message_error', (error) => {
        dispatch(chatError(error.error));
      });

      // Typing events
      socket.on('typing', ({ userId, isTyping }) => {
        if (isTyping) {
          dispatch(setTyping(userId));
        } else {
          dispatch(clearTyping(userId));
        }
      });

      // Conversation events
      socket.on('conversations_loaded', (conversations) => {
        dispatch(loadConversations(conversations));
      });

      socket.on('messages_loaded', ({ messages, hasMore }) => {
        dispatch(loadMessages(messages, hasMore));
      });

      socket.on('conversations_error', (error) => {
        dispatch(chatError(error.error));
      });

      socket.on('messages_error', (error) => {
        dispatch(chatError(error.error));
      });

      // Request initial data
      socket.emit('get_conversations');

      // Handle page unload/refresh
      const handleBeforeUnload = () => {
        socket.emit('user_offline', user._id);
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        socket.emit('user_offline', user._id);
        socket.disconnect();
      };
    }
  }, [user, token, dispatch]);

  return socketRef.current;
};

export default useSocket;