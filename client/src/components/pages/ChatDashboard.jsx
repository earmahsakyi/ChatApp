// ChatDashboard.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip,
  Smile,
  Users,
  Settings,
  Bell,
  Circle,
  UserPlus,
  LogOut
} from "lucide-react";
import DarkModeToggle from "../layout/DarkModeToggle";
import UserSearch from "../layout/UserSearch";
import useSocket from "../../hooks/useSocket";
import { logout } from "../../actions/authAction";
import { setActiveChat, markMessagesRead } from "../../actions/chatActions";

const ChatDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const { user } = useSelector(state => state.auth);
  const { conversations, activeChat, messages, onlineUsers, typingUsers } = useSelector(state => state.chat);
  
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  const socket = useSocket();

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
useEffect(() => {
  if (socket && activeChat && message) {
    if (message.trim()) {
      // User is typing
      if (!isTyping) {
        setIsTyping(true);
        socket.emit("typing", { 
          receiverId: activeChat._id, 
          isTyping: true 
        });
      }

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 1 second of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit("typing", { 
          receiverId: activeChat._id, 
          isTyping: false 
        });
      }, 1000);
    } else {
      // Message is empty, immediately stop typing
      if (isTyping) {
        setIsTyping(false);
        socket.emit("typing", { 
          receiverId: activeChat._id, 
          isTyping: false 
        });
      }
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  }

  // Cleanup function
  return () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
}, [message, socket, activeChat]); // Remove isTyping from dependencies

// Also add cleanup when component unmounts or activeChat changes
useEffect(() => {
  return () => {
    if (socket && activeChat && isTyping) {
      socket.emit("typing", { 
        receiverId: activeChat._id, 
        isTyping: false 
      });
    }
  };
}, [activeChat]); 

  // Load messages when active chat changes
  useEffect(() => {
    if (socket && activeChat) {
      socket.emit("get_messages", { userId: activeChat._id });
      // Mark messages as read
      dispatch(markMessagesRead(activeChat._id));
      if (socket) {
        socket.emit("mark_messages_read", { senderId: activeChat._id });
      }
    }
  }, [activeChat, socket, dispatch]);

  // Filter conversations based on search
  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(conv => 
      conv.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !activeChat || !socket) return;

    const messageData = {
      receiver: activeChat._id,
      content: message.trim()
    };

    socket.emit("send_message", messageData);
    setMessage("");
    setIsTyping(false);
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
  };

  const selectConversation = (conversation) => {
    dispatch(setActiveChat(conversation));
  };

  const handleLogout = () => {
    if (socket) {
      socket.emit("user_offline", user._id);
    }
    dispatch(logout());
    navigate('/')
    
  };

  const getLastMessageTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  const isUserOnline = (userId) => {
    return Array.from(onlineUsers).includes(userId);
  };

  const isUserTyping = (userId) => {
    return Array.from(typingUsers).includes(userId);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {!showUserSearch ? (
        <div className="flex w-80 flex-col border-r bg-card">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user?.username?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-semibold">SwiftChat</h1>
                  <div className="flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                    <span className="text-xs text-muted-foreground">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowUserSearch(true)}
                  title="Find users"
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Settings">
                  <Settings className="h-4 w-4" />
                </Button>
                <DarkModeToggle />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLogout}
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Online Users Count */}
          <div className="px-4 py-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{Array.from(onlineUsers).length} users online</span>
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">
                    {conversations.length === 0 ? "No conversations yet" : "No conversations found"}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => setShowUserSearch(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Find users to chat
                  </Button>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/60 ${
                      activeChat?._id === conversation._id ? "bg-muted" : ""
                    }`}
                    onClick={() => selectConversation(conversation)}
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback>
                          {conversation.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isUserOnline(conversation._id) && (
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="truncate font-medium text-sm">
                          {conversation.name}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {conversation.lastMessage && getLastMessageTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs text-muted-foreground">
                          {isUserTyping(conversation._id) ? (
                            <span className="text-primary italic">typing...</span>
                          ) : (
                            conversation.lastMessage?.content || "Start a conversation"
                          )}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="h-5 w-5 p-1.5 text-xs">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      ) : (
        <UserSearch onClose={() => setShowUserSearch(false)} />
      )}
      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="border-b bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={activeChat.avatar} />
                      <AvatarFallback>
                        {activeChat.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isUserOnline(activeChat._id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold">{activeChat.name}</h2>
                    <p className="text-sm text-muted-foreground">
                      {isUserOnline(activeChat._id) ? (
                        isUserTyping(activeChat._id) ? (
                          <span className="text-primary">typing...</span>
                        ) : (
                          "Online"
                        )
                      ) : (
                        "Offline"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" title="Voice call">
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="Video call">
                    <Video className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" title="More options">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">Start your conversation</h3>
                    <p className="text-sm">
                      Send a message to {activeChat.name} to begin your chat.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`flex ${
                        message.sender === user._id ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                          message.sender === user._id
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-xs opacity-70">
                            {getLastMessageTime(message.timestamp)}
                          </span>
                          {message.sender === user._id && (
                            <div className="flex">
                              {message.read ? (
                                <div className="flex">
                                  <Circle className="h-2 w-2 fill-current opacity-70" />
                                  <Circle className="h-2 w-2 fill-current opacity-70 -ml-1" />
                                </div>
                              ) : (
                                <Circle className="h-2 w-2 fill-current opacity-70" />
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t bg-card p-4">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <Button type="button" variant="ghost" size="icon" title="Attach file">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder={`Message ${activeChat.name}...`}
                    value={message}
                    onChange={handleInputChange}
                    className="pr-12"
                    maxLength={1000}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2"
                    title="Add emoji"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  type="submit" 
                  disabled={!message.trim()}
                  className="px-6"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              {message.length > 900 && (
                <div className="text-xs text-muted-foreground mt-1 text-right">
                  {message.length}/1000
                </div>
              )}
            </div>
          </>
        ) : (
          // No chat selected
          <div className="flex flex-1 items-center justify-center bg-muted/10">
            <div className="text-center">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Welcome to SwiftChat</h3>
              <p className="text-muted-foreground max-w-md mb-4">
                Select a conversation from the sidebar to start chatting, or find new users to connect with.
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  variant="outline"
                  onClick={() => setShowUserSearch(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Find Users
                </Button>
              </div>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
                <div className="text-center p-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Real-time Chat</h4>
                  <p className="text-sm text-muted-foreground">
                    Instant messaging with live typing indicators
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Circle className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Online Status</h4>
                  <p className="text-sm text-muted-foreground">
                    See who's online and available to chat
                  </p>
                </div>
                <div className="text-center p-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <Bell className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="font-medium mb-1">Smart Notifications</h4>
                  <p className="text-sm text-muted-foreground">
                    Never miss important messages with read receipts
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDashboard;