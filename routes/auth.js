const express  = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { check, body } =require('express-validator');

router.get('/',auth, authController.getLoginUser);
router.post('/login', [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists()
], authController.AuthUserToken);
router.post('/register',[
    check('email', 'Please enter your email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({min: 6}),

    
], 
authController.registerUser);
router.post('/forgot-password', 
    [
      body('email').isEmail().withMessage(('Invalid Email Format'))  
    ],
    authController.forgotPassword

)
router.post('/reset-password', 
    [
      check('password', 'Please enter a password with 6 or more characters').isLength({min : 6})  
    ],
    authController.ResetPassword

)
router.get('/users',auth,authController.getAllUsers)
router.get('/:id',auth,authController.getUserById)




module.exports = router;

