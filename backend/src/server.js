require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const redis = require('redis');

const mongoose = require('mongoose');
// const socket = require('./socket');
const MQTTConnect = require('./mqtt');
const cookieParser = require('cookie-parser');
const fs = require('fs')
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const usersRoutes = require('./routes/usersRoutes');
const User = require('./models/User');


const FORCE_EXIT_TIME = 20000 // 20 seconds

// Initialize Express and HTTP server
const app = express();

const server = http.createServer(app);

// Redis
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

redisClient.on('error', (err) => console.log(`[ERROR]: Redis Client Error: ${err}`));
redisClient.connect()
    .then(() => console.log(`[INFO]: Connected to redis.`))
    .catch((err) => console.error(`[ERROR]: Failed to connect to Redis: ${err}`));


// Middleware
app.use(express.json());
app.use(cors({
    origin: ['http://localhost', 'http://localhost:3000'], // Allowing requests from Nextjs server
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
}))
app.use(cookieParser());


// Routes
app.use( '/api/auth', authRoutes );
app.use( '/api/files', fileRoutes );
app.use( '/api/users', usersRoutes)

app.get('/api/health', (_req, res) => {
    if (mongoose.connection.readyState === 1) {
        return res.status(200).send("OK");
    }
    return res.status(503).send("Database not ready");
});
// // WebSocket
// socket( io );

// MQTT
MQTTConnect();


// MongoDB connection
async function connectToDatabase(retries = 15, delay = 3000) {
    while (retries > 0) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('[Info]: Connected to database.');

            const adminExists = await User.findOne({ login: 'admin' });
            const userExists = await User.findOne({ login: 'user' });

            if (!adminExists) {
                console.log(`[Info]: Admin not found in database. Creating admin account.`);
                const hashedPassword = await bcrypt.hash('admin', 10);

                await User.create({
                    login: 'admin',
                    password: hashedPassword,
                    group: 'admin'
                });
            }
            if (!userExists) {
                console.log(`[Info]: User not found in database. Creating user account.`);
                const hashedPassword = await bcrypt.hash('user', 10);

                await User.create({
                    login: 'user',
                    password: hashedPassword,
                    group: 'user'
                });
            }
            return;
        } catch (err) {
            retries -= 1;
            console.log(`[Error]: Couldn't connect to database (retrying in ${delay / 1000}s, retries left: ${retries}): \n${err}`);
            if (retries === 0) {
                console.error('[Error]: Exhausted database connection retries.');
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
}

connectToDatabase();

    
// Graceful Shutdown
function gracefulShutdown(signal) {
    console.log(`[INFO]: Received ${signal} signal. Shuttind down the system...`);

    const forceExitTimeout = setTimeout(() => {
        console.error(`[ERROR]: Force shutdown. Couldn't close all services in time (${FORCE_EXIT_TIME})`);
        process.exit(1);
    }, 20000);

    server.close(async () => {
        
        try {
            if(redisClient.isOpen) {
                await redisClient.quit();
                console.log(`[INFO]: Redis has been closed.`);
            }
            
            if( mongoose.connection.readyState !== 0 ) {
                await mongoose.connection.close();
                console.log(`[INFO]: MongoDB connection closed.`);
            }

            console.log(`[INFO]: All services closed. Exiting...`);
            clearTimeout(forceExitTimeout);
            process.exit(0);
        } catch(error) {
            console.error(`[ERROR]: Error during graceful shutdown: ${error}`);
            clearTimeout(forceExitTimeout);
            process.exit(1)
        }
    });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const PORT = process.env.BACKEND_PORT;

server.listen(PORT, () => {
    console.log(`[Info]: HTTP server and WebSocket are listening on port ${PORT}`);
});


// For tests
module.exports = server;