import {
  LOAD_USERS,
  SEARCH_USERS,
  CLEAR_SEARCH,
  USERS_ERROR
} from '../actions/types.js';

const initialState = {
  users: [],
  searchResults: [],
  loading: false,
  error: null
};

export default function usersReducer(state = initialState, action) {
  const { type, payload } = action;

  switch (type) {
    case LOAD_USERS:
      return {
        ...state,
        users: payload,
        loading: false,
        error: null
      };
    
    case SEARCH_USERS:
      return {
        ...state,
        searchResults: payload,
        loading: false,
        error: null
      };
    
    case CLEAR_SEARCH:
      return {
        ...state,
        searchResults: []
      };
    
    case USERS_ERROR:
      return {
        ...state,
        error: payload,
        loading: false
      };
    
    default:
      return state;
  }
}