const SECRET_KEY = process.env.SECRET_KEY;
const { isNameValid } = require('../utils/files');

const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getUsers = async (req, res) => {
    const { search } = req.query;
    console.log(`[Info]: Get users list request received${search ? ` with params: ${search}` : ''}.`);
    
    try {
        const filter = {};

        if(search) {
            filter.login = { $regex: search, $options: 'i' }
        }

        const users = await User.find(filter).select("-password");

        console.log(`[Info]: Request approved. Sending users list.`)
        return res.status(200).json({
            success: true,
            data: users
        });
    } catch(error) {
        console.log(`[Error]: Error on get users request: ${error}`);
        return res.status(500).json({
            success: false,
            message: "server"
        });
    };
};

exports.getUserData = async (req, res) => {
    const { login } = req.params;
    console.log(`[Info]: Get user data request received for: ${login}`);

    try {
        const user = await User.findOne({ login: login }).select('-password');

        if(!user) throw { status: 404, message: "userNotFound" };

        console.log(`[Info]: Request approved. Sending user data.`)
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch(error) {
        if(error.message) console.log(`[Info]: Request rejected - ${error.message}`)
        else console.log(`[Error]: Error on get user data request: ${error}`);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "server"
        });        
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    console.log(`[Info]: Delete user request received for user id: ${id}.`);
    
    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if(!deletedUser) throw { status: 404, message: "userNotFound" };

        console.log(`[Info]: Request approved. User has been deleted.`)
        return res.status(200).json({
            success: true
        });
    } catch(error) {
        if(error.message) console.log(`[Info]: Request rejected - ${error.message}`)
        else console.log(`[Error]: Error on delete user request: ${error}`);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "server"
        });
    };
};

exports.createUser = async (req, res) => {
    const { login, password, group } = req.body;
    console.log(`[Info]: Register request received for:`, login);

    try {
        const loginLength = login ? login.length : 0;
        if( loginLength < 3 || loginLength > 20 || !isNameValid(login) ) throw { status: 400, message: "invalidLogin" };

        const existingUser = await User.findOne({ login });
        if(existingUser) throw { status: 409, message: "userExists" };

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await User.create({
            login,
            password: hashedPassword,
            group
        });
        console.log(`[Info]: Request accepted. New user has been created.`);
        
        return res.status(201).json({
            success: true,
            userId: newUser._id
        });
    } catch(error) {
        if(error.status) console.log(`[Info]: Couldn't create user: ${error.message}`);
        else console.log(`[Error]: Server error on register request:\n`, error);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { login, password, group, avatar } = req.body || {};
    console.log(`[Info]: Update user request received for user id: ${id}`);

    try {
        let user = null;
        try {
            user = await User.findById(id);
        } catch (e) {}
        if (!user) {
            user = await User.findOne({ login: id });
        }
        if (!user) throw { status: 404, message: "userNotFound" };

        if (login && login !== user.login) {
            if (login.length < 3 || login.length > 20 || !isNameValid(login)) {
                throw { status: 400, message: "invalidLogin" };
            }
            const exists = await User.findOne({ login });
            if (exists) throw { status: 409, message: "userExists" };
            user.login = login;
        }

        if (password) {
            if (password.length < 3 || password.length > 64) {
                throw { status: 400, message: "invalidPassword" };
            }
            user.password = await bcrypt.hash(password, 10);
        }

        if (group && ['user', 'admin'].includes(group)) {
            if (user.group === 'admin' && group === 'user') {
                const adminCount = await User.countDocuments({ group: 'admin' });
                if (adminCount <= 1) {
                    throw { status: 400, message: "cannotDemoteLastAdmin" };
                }
            }
            user.group = group;
        }

        if (typeof avatar === 'string') {
            user.avatar = avatar;
        }

        await user.save();
        const sanitized = user.toObject ? user.toObject() : { ...user };
        delete sanitized.password;

        console.log(`[Info]: Request approved. User ${id} updated.`);
        return res.status(200).json({
            success: true,
            data: sanitized
        });
    } catch (error) {
        if (error.status) console.log(`[Info]: Couldn't update user: ${error.message}`);
        else console.log(`[Error]: Server error on update user request: ${error}`);
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "server"
        });
    }
};
