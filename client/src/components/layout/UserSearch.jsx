import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, MessageCircle, Users } from 'lucide-react';
import axios from 'axios';
import { setActiveChat } from '../../actions/chatActions';

const UserSearch = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = 'http://localhost:5000/api';

  // Load all users on component mount
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/users/all`);
        setAllUsers(res.data.data);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllUsers();
  }, [API_URL]);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/users/search?q=${searchQuery}`);
        setSearchResults(res.data.data);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, API_URL]);

  const handleStartChat = (selectedUser) => {
    dispatch(setActiveChat({
      _id: selectedUser._id,
      name: selectedUser.username,
      email: selectedUser.email,
      avatar: selectedUser.avatar
    }));
    onClose();
  };

  const displayUsers = searchQuery.length >= 2 ? searchResults : allUsers;

  return (
    <div className="w-80 border-r bg-card">
      <div className="border-b p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Find Users</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username or email..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery.length >= 2 ? 'No users found' : 'No users available'}
              </p>
            </div>
          ) : (
            displayUsers.map((userItem) => (
              <div
                key={userItem._id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/60 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {userItem.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {userItem.username}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userItem.email}
                  </p>
                  {userItem.hasConversation && (
                    <p className="text-xs text-primary">
                      Previous conversation
                    </p>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStartChat(userItem)}
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default UserSearch;