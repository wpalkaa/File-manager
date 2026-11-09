const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { isNameValid } = require('../utils/files');
const secrets = require('../../config/secrets');

const SECRET_KEY = secrets.jwtSecret;



exports.login = async (req, res) => {
    console.log(`[Info]: Login request received for:\n`, req.body);
    const { login, password } = req.body;

    try{
        const isLoginValid = isNameValid(login);
        if(!isLoginValid) throw { status: 400, message: 'illegalLogin' }

        const user = await User.findOne({ login });

        if(!user) throw { status: 401, message: 'authRejected' };

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) throw { status: 401, message: 'authRejected' };

        console.log(`[Info]: Login request approved for ${user.login}`);


        // Generate JWT token
        const token = jwt.sign(  // jwt.sign(payload, secretOrPrivateKey, [options, callback])
            {
                userId: user._id,
                login: user.login,
                group: user.group    
            },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.cookie('user_session', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7d 24h 60min 60s 1000s = 7d
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/'
        });

        return res.status(200).json({
            success: true,
            user: { 
                    login: user.login,
                    group: user.group 
                }
        });
    } catch(error) {
        if(error.status)console.log('[Info]: Login request rejected - wrong login or password.');
        else console.log(`[Error]: Server error on login request: \n`, error)
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'server'
        });
    };
};