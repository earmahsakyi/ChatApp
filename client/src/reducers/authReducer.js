import { 
    AUTH_ERROR, REGISTER_FAIL, REGISTER_SUCCESS, LOGIN_SUCCESS, LOGIN_FAIL, LOGOUT, USER_LOADED, AUTH_SET_LOADING,
     FORGOT_PASSWORD_SUCCESS, FORGOT_PASSWORD_FAIL,
     RESET_PASSWORD_SUCCESS, RESET_PASSWORD_FAIL,
 
} from '../actions/types';

const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    user: null,
    loading: false,
    error: null,
    message: '',
    email: '',
    passwordResetStatus: null,
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    // Loading state
    case AUTH_SET_LOADING:
      return { ...state, loading: true, error: null };

    
    case LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token)
      return {
      ...state,
        isAuthenticated: true,
     loading: false,
      error: null,
      token: action.payload.token, 
       user: {
          id: action.payload.userId,
      
        }
   };

    case REGISTER_SUCCESS:
  return {
    ...state,
    isAuthenticated: true, 
    loading: false,
    email: action.payload.email || localStorage.getItem('email') || '',
  };

    case USER_LOADED:
        return {
                  ...state,
             isAuthenticated: true,
              loading: false,
            error: null,
             user: {
              ...state.user,
            ...action.payload, 
      id: action.payload._id || action.payload.userId 
    }
  };


    // Error handling
    case REGISTER_FAIL:
    case LOGIN_FAIL:
    case AUTH_ERROR:
    case LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
      };
      case RESET_PASSWORD_SUCCESS:
        return{
          ...state,
        loading: false,
        passwordResetStatus: 'success',
        message: action.payload.message || action.payload,
        email: null
        }
    // Password reset
    case FORGOT_PASSWORD_SUCCESS:
      return {
        ...state,
        loading: false,
        passwordResetStatus: 'success',
        message: action.payload.message || action.payload,
        email: action.payload.email || '',
        passwordResetStatus: 'codeSent'
      };
    case RESET_PASSWORD_FAIL:
    case FORGOT_PASSWORD_FAIL:
      return{
          ...state,
          loading: false,
          error: action.payload

      }

    default:
      return state;
  }
};

export default authReducer;