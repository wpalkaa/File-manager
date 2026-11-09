const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

const verifyAdmin = (req, res, next) => {
    console.log(`[Info]: Verify admin request received.`);
    try {
        const cookieStorage = req.cookies || {};

        const sessionCookie = cookieStorage.user_session;
        if(!sessionCookie) throw { status: 401, message: "Unauthenticated" };

        const decodedToken = jwt.verify(sessionCookie, SECRET_KEY);
        if( decodedToken.group !== 'admin' ) throw { status: 403, message: "Unauthorized" };

        req.user = decodedToken;
        next();
    } catch(error) {
        if(error.status) console.log(`[Info]: Request rejected - ${error.message}`);
        else console.log(`[Error]: Server error when veryfing admin permission: \n${error}`);
        const statusCode = error.status || 403;
        return res.status(statusCode).json({
            success: false,
            message: error.message || "Unauthorized" 
        });
    };
};

module.exports = verifyAdmin;
