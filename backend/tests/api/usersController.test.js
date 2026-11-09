const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');

const usersRoutes = require('../../src/routes/usersRoutes');
const verifyAdmin = require('../../src/middleware/verifyAdmin');
const User = require('../../src/models/User');
const { isNameValid } = require('../../src/utils/files');



// Express app for tests
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/users', usersRoutes);

jest.mock('../../src/models/User');
jest.mock('../../src/middleware/verifyAdmin');
jest.mock('../../src/utils/files');
jest.mock('bcryptjs');






describe('/api/users', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/users', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everythin ok', async () => {
            User.find.mockReturnValue({
                select: jest.fn().mockResolvedValue([{ login: 'user1' }, { login: 'user2' }])
            });

            const r = await request(app).get('/api/users');

            expect(r.statusCode).toBe(200);
            expect(r.body.success).toBe(true);
            expect(r.body.data).toMatchObject([{ login: 'user1' }, { login: 'user2' }]);
        });

        it('Some server error', async () => {
            User.find.mockReturnValue({
                select: jest.fn().mockRejectedValue(new Error())
            });

            const r = await request(app).get('/api/users');

            expect(r.statusCode).toBe(500);
            expect(r.body.success).toBe(false);
        });
    });


    describe('GEET /api/users/:login', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue({ login: 'admin', group: 'admin' })
            });

            const r = await request(app).get('/api/users/admin');

            expect(r.statusCode).toBe(200);
            expect(r.body.success).toBe(true);
            expect(r.body.data).toMatchObject({ login: 'admin', group: 'admin'} );
        });

        it('User not found', async () => {
            User.findOne.mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            const r = await request(app).get('/api/users/djaiwodjaiowd');

            expect(r.statusCode).toBe(404);
            expect(r.body.success).toBe(false);
            expect(r.body.message).toBe('userNotFound');
        });
    });


    describe('DELETE /api/users/:id', () => {
        afterEach(() => jest.clearAllMocks());

        beforeEach(() => {
            verifyAdmin.mockImplementation((req, res, next) => {
                next();
            });
        });

        it('Everything ok', async () => {
            User.findByIdAndDelete.mockResolvedValue({ _id: '1', login: 'deletedUser' });

            const r = await request(app).delete('/api/users/delete/1');

            expect(r.statusCode).toBe(200);
            expect(r.body.success).toBe(true);
        });

        it('Unaithorized request', async () => {
            verifyAdmin.mockImplementationOnce( (req, res, next) => {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized'
                })
            })

            const r = await request(app).delete('/api/users/delete/1');expect(r.statusCode).toBe(403);

            expect(User.findByIdAndDelete).not.toHaveBeenCalled();            
            expect(r.statusCode).toBe(403);
            expect(r.body.success).toBe(false);
            expect(r.body.message).toBe('Unauthorized');
            
        })

        it('User not found', async () => {
            User.findByIdAndDelete.mockResolvedValue(null);
            
            const r = await request(app).delete('/api/users/delete/inoberte');

            expect(r.statusCode).toBe(404);
            expect(r.body.success).toBe(false);
            expect(r.body.message).toBe('userNotFound')
        });
    });



    describe('POST /api/users/create', () => {
        afterEach(() => jest.clearAllMocks());
        
        const reqBody = { 
            login: 'user', 
            password: '12345', 
            group: 'user' 
        };

        it('Everything ok', async () => {
            User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashed');
            User.create.mockResolvedValue({ 
                login: 'user', 
                password: 'hashed',
                group: 'user'
            });
            isNameValid.mockReturnValue(true);

            const res = await request(app).post('/api/users/create').send(reqBody);

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);

            expect(bcrypt.hash).toHaveBeenCalledWith('12345', 10);
            expect(User.create).toHaveBeenCalledWith({
                login: 'user',
                password: 'hashed',
                group: 'user'
            });
        });

        it('Invalid login provided', async () => {

            isNameValid.mockReturnValue(false);

            const res = await request(app).post('/api/users/create').send(reqBody);

            expect(res.statusCode).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('invalidLogin');
        });

        it('User already exists', async () => {
            User.findOne.mockResolvedValue({ login: 'user' });
            isNameValid.mockReturnValue(true);

            const res = await request(app).post('/api/users/create').send(reqBody);

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('userExists');
        });

        it('Server error', async () => {
            User.findOne.mockRejectedValue(new Error());
            isNameValid.mockReturnValue(true);

            const res = await request(app).post('/api/users/create').send(reqBody);

            expect(res.statusCode).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('server');
        });
    });

    describe('PATCH /api/users/:id', () => {
        afterEach(() => jest.clearAllMocks());
        beforeEach(() => {
            verifyAdmin.mockImplementation((req, res, next) => next());
        });

        it('Everything ok', async () => {
            const fakeUser = {
                login: 'olduser',
                save: jest.fn().mockResolvedValue(),
                toObject: jest.fn().mockReturnValue({ _id: '123', login: 'updateduser' })
            };
            User.findById.mockResolvedValue(fakeUser);
            User.findOne.mockResolvedValue(null);
            isNameValid.mockReturnValue(true);
            bcrypt.hash.mockResolvedValue('hashed');

            const res = await request(app).patch('/api/users/123').send({
                login: 'updateduser'
            });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.login).toBe('updateduser');
        });

        it('User not found', async () => {
            User.findById.mockResolvedValue(null);

            const res = await request(app).patch('/api/users/999').send({
                login: 'test'
            });

            expect(res.statusCode).toBe(404);
            expect(res.body.message).toBe('userNotFound');
        });

        it('Unauthorized when not admin', async () => {
            verifyAdmin.mockImplementationOnce((req, res, next) => {
                return res.status(403).json({ success: false, message: 'Unauthorized' });
            });

            const res = await request(app).patch('/api/users/123').send({
                login: 'test'
            });

            expect(res.statusCode).toBe(403);
            expect(res.body.message).toBe('Unauthorized');
        });
    });
});
