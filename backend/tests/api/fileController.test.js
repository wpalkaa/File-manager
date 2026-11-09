const request = require('supertest');
const express = require('express');
const fs = require('fs');

const fileController = require('../../src/controllers/fileController');
const fileRoutes = require('../../src/routes/fileRoutes');
const { isNameValid, getTargetPath } = require('../../src/utils/files');

jest.mock('fs', () => {
  const { Readable } = require('stream');
  return {
    stat: jest.fn((p, cb) => {
      if (typeof cb === 'function') cb(null, { isFile: () => true, size: 100 });
    }),
    createReadStream: jest.fn(() => Readable.from(['binary-data'])),
    promises: {
      access: jest.fn(),
      readdir: jest.fn(),
      stat: jest.fn(),
      rename: jest.fn(),
      rm: jest.fn(),
      mkdir: jest.fn(),
      writeFile: jest.fn(),
      readFile: jest.fn(),
    }
  };
});

jest.mock('archiver', () => {
    return jest.fn().mockImplementation(() => ({
        pipe: jest.fn(),
        directory: jest.fn(),
        finalize: jest.fn()
    }));
});

jest.mock('../../src/utils/files');

const app = express();
app.use(express.json());
app.use('/api/files', fileRoutes)







describe('/api/files', () => {
    const API_URL = '/api/files'
    
    beforeEach(() => {
        req = { 
            body: { 
                path: '/',
            } 
        };
    });
    const targetPath = '/home'

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /listFiles', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            getTargetPath.mockReturnValue(targetPath)
            fs.promises.readdir.mockResolvedValue(['p1.txt', 'p2.txt', 'd1']);
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 67
            });
    
            const response = await request(app).post(`${API_URL}/listFiles`).send(req.body);
    
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.files[0].name).toBe('p1.txt');
            expect(response.body.files[1].name).toBe('p2.txt')
        });
        
        it('Attemp to access files outside filesystem', async () => {
            req.body.path = '../../../../../.env'
            getTargetPath.mockRejectedValue({ status: 400, message: "invalidDirectoryPath" })
    
            const response = await request(app).post(`${API_URL}/listFiles`).send(req.body);
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'invalidDirectoryPath'
            })
        })
        
        it('Some server error', async () => {
            getTargetPath.mockRejectedValue(new Error())
    
            const response = await request(app).post(`${API_URL}/listFiles`).send(req.body);
            
            expect(response.statusCode).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                message: 'server'
            })
        })
    });

    describe('POST /getFileInfo', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            getTargetPath.mockResolvedValue(targetPath);

            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 1234
            });

            const response = await request(app).post(`${API_URL}/getFileInfo`).send(req.body);

            expect(fs.promises.stat).toHaveBeenCalled();

            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                directory: req.body.path,
                fileInfo: expect.anything()
            });
        });

        it('Attempt to access files outside filesystem', async () => {
            req.body.path = '../../../../.env'
            getTargetPath.mockRejectedValue({ status: 400, message: "invalidDirectoryPath" });

            const response = await request(app).post(`${API_URL}/getFileInfo`).send(req.body);

            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'invalidDirectoryPath'
            });
        });

        it('File does not exist', async () => {
            getTargetPath.mockRejectedValue({ status: 404, message: "fileDoesNotExist" });
            const response = await request(app).post(`${API_URL}/getFileInfo`).send(req.body);

            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                success: false,
                message: 'fileDoesNotExist'
            });
        });

        it('Server error', async () => {
            getTargetPath.mockRejectedValue(new Error());

            const response = await request(app).post(`${API_URL}/getFileInfo`).send(req.body);

            expect(response.statusCode).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                message: 'server'
            });
        });
    });


    describe('POST /getSize', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            getTargetPath.mockResolvedValue(targetPath);
    
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 2137
            });
    
            const response = await request(app).post(`${API_URL}/getSize`).send(req.body);
    
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.size).toBe(2137)
        });

        it('Attemp to access files outside filesystem', async () => {
            req.body.path = '../../../../../.env' 
            getTargetPath.mockRejectedValue({ status: 400, message: "invalidDirectoryPath" })
    
            const response = await request(app).post(`${API_URL}/getSize`).send(req.body);
            
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'invalidDirectoryPath'
            })
        })

        it('Some server error', async () => {
            getTargetPath.mockRejectedValue(new Error())
    
            const response = await request(app).post(`${API_URL}/getSize`).send(req.body);
            
            expect(response.statusCode).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                message: 'server'
            })
        })
    })


    // ??
    // describe('POST /download', () => {


    //     beforeEach(() => {
    //         req = { 
    //             body: { 
    //                 path: '/p1.txt'
    //             } 
    //         };
    //     });

    //     afterEach(() => jest.clearAllMocks());

    // });
    


    describe('PATCH /rename', () => {

        beforeEach(() => {
            req = { 
                body: { 
                    path: '/old.txt',
                    newName: 'new.txt'
                } 
            };
        });
        const targetPath = '/home/old.txt'
        const newTargetPath = '/home/new.txt'

        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            isNameValid.mockReturnValue(true);

            getTargetPath.mockResolvedValueOnce(targetPath);
            getTargetPath.mockResolvedValueOnce(newTargetPath);

            fs.promises.rename.mockResolvedValue(undefined);

            const response = await request(app).patch(`${API_URL}/rename`).send(req.body);

            expect(fs.promises.rename).toHaveBeenCalledWith(targetPath, expect.stringContaining(req.body.newName));
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'File name has been changed'
            });
        });

        it('Invalid name provided', async () => {
            isNameValid.mockReturnValue(false);

            const response = await request(app).patch(`${API_URL}/rename`).send(req.body);

            expect(fs.promises.rename).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'File name is not allowed'
            });
        });

        it('File not found', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockRejectedValueOnce({ status: 404, message: "fileDoesNotExist" });

            const response = await request(app).patch(`${API_URL}/rename`).send(req.body);

            expect(fs.promises.rename).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                success: false,
                message: 'fileDoesNotExist'
            });
        });

        it('File already exists', async () => {
            isNameValid.mockReturnValue(true);

            getTargetPath.mockResolvedValueOnce(targetPath) 
            getTargetPath.mockRejectedValueOnce({ status: 409, message: "fileExists" });

            const response = await request(app).patch(`${API_URL}/rename`).send(req.body);

            expect(fs.promises.rename).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(409);
            expect(response.body).toMatchObject({
                success: false,
                message: 'fileExists'
            });
        });

        it('Outside of filepath attmpet', async () => {
            req.body.path = '../../../../.env'

            isNameValid.mockReturnValue(true);
            getTargetPath.mockRejectedValueOnce({ status: 400, message: "invalidDirectoryPath" });

            const response = await request(app).patch(`${API_URL}/rename`).send(req.body);

            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'invalidDirectoryPath'
            });
        });

        it('Some server error', async () => {
            isNameValid.mockReturnValue(true);
            
            getTargetPath.mockResolvedValueOnce(targetPath)
            getTargetPath.mockResolvedValueOnce(newTargetPath);

            // Symulujemy błąd systemu plików (np. plik zablokowany przez inny proces)
            fs.promises.rename.mockRejectedValue(new Error());

            const response = await request(app).patch(`${API_URL}/rename`).send(req.body);

            expect(response.statusCode).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                message: 'server'
            });
        });

    });

    


    describe('DELETE /delete', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            getTargetPath.mockResolvedValue(targetPath);
            
            fs.promises.rm.mockResolvedValue(undefined);

            const response = await request(app).delete(`${API_URL}/delete`).send(req.body);

            expect(fs.promises.rm).toHaveBeenCalledWith(targetPath, { recursive: true });
            
            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'File has been deleted'
            });
        });

        it('File does not exist', async () => {
            getTargetPath.mockRejectedValue({ status: 404, message: "fileDoesNotExist" });

            const response = await request(app).delete(`${API_URL}/delete`).send(req.body);

            expect(fs.promises.rm).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(404);
            expect(response.body).toMatchObject({
                success: false,
                message: 'fileDoesNotExist'
            });
        });

        it('Attempt to delete outside filesystem', async () => {
            req.body.path = '../../.env';
            
            getTargetPath.mockRejectedValue({ status: 400, message: "invalidDirectoryPath" });

            const response = await request(app).delete(`${API_URL}/delete`).send(req.body);

            expect(fs.promises.rm).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'invalidDirectoryPath'
            });
        });

        it('Some server error', async () => {
            getTargetPath.mockResolvedValue(targetPath);
            
            fs.promises.rm.mockRejectedValue(new Error());

            const response = await request(app).delete(`${API_URL}/delete`).send(req.body);

            expect(response.statusCode).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                message: 'server'
            });
        });

    });




    describe('POST /create', () => {
        beforeEach(() => {
            req = { 
                body: { 
                    path: '/',
                    name: 'p1.txt',
                    isDirectory: false
                } 
            };
        });
        const targetPath = '/home/p1.txt'

        afterEach(() => jest.clearAllMocks());

        it('Everything ok - file', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValue(targetPath);
            fs.promises.writeFile.mockResolvedValue(undefined);

            const response = await request(app).post(`${API_URL}/create`).send(req.body);

            expect(fs.promises.writeFile).toHaveBeenCalledWith(targetPath, '');
            expect(fs.promises.mkdir).not.toHaveBeenCalled();

            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'File has been created'
            });
        });

        it('Everything ok - directory', async () => {
            req.body.name = 'dir';
            req.body.isDirectory = true;

            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValue('/home/dir');
            fs.promises.mkdir.mockResolvedValue(undefined);

            const response = await request(app).post(`${API_URL}/create`).send(req.body);

            expect(fs.promises.mkdir).toHaveBeenCalledWith('/home/dir');
            expect(fs.promises.writeFile).not.toHaveBeenCalled();

            expect(response.statusCode).toBe(200);
            expect(response.body).toMatchObject({
                success: true,
                message: 'File has been created'
            });
        });

        it('Invalid file name provided', async () => {
            req.body.name = '<><><>$<#@<>';
            isNameValid.mockReturnValue(false);

            const response = await request(app).post(`${API_URL}/create`).send(req.body);

            expect(fs.promises.writeFile).not.toHaveBeenCalled();
            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'File name is not allowed'
            });
        });

        it('File already exists', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockRejectedValue({ status: 409, message: "fileExists" });

            const response = await request(app).post(`${API_URL}/create`).send(req.body);

            expect(response.statusCode).toBe(409);
            expect(response.body).toMatchObject({
                success: false,
                message: 'fileExists'
            });
        });

        it('Attempt to create file in invalid path', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockRejectedValue({ status: 400, message: "invalidDirectoryPath" });

            const response = await request(app).post(`${API_URL}/create`).send(req.body);

            expect(response.statusCode).toBe(400);
            expect(response.body).toMatchObject({
                success: false,
                message: 'invalidDirectoryPath'
            });
        });

        it('Some server eerror', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValue(targetPath);
            
            fs.promises.writeFile.mockRejectedValue(new Error());

            const response = await request(app).post(`${API_URL}/create`).send(req.body);

            expect(response.statusCode).toBe(500);
            expect(response.body).toMatchObject({
                success: false,
                message: 'server'
            });
        });

    });

    describe('GET /raw', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            getTargetPath.mockResolvedValue('/home/photo.png');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false
            });

            const response = await request(app).get(`${API_URL}/raw?path=/photo.png`);
            expect(response.statusCode).toBe(200);
            expect(response.headers['content-type']).toContain('image/png');
        });

        it('Target is directory', async () => {
            getTargetPath.mockResolvedValue('/home/folder');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => true
            });

            const response = await request(app).get(`${API_URL}/raw?path=/folder`);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('notAFile');
        });
    });

    describe('GET /content', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            getTargetPath.mockResolvedValue('/home/file.txt');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 20,
                mtime: new Date()
            });
            fs.promises.readFile.mockResolvedValue('text content');

            const response = await request(app).get(`${API_URL}/content?path=/file.txt`);
            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.content).toBe('text content');
        });

        it('File too large', async () => {
            getTargetPath.mockResolvedValue('/home/file.txt');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 6 * 1024 * 1024,
                mtime: new Date()
            });

            const response = await request(app).get(`${API_URL}/content?path=/file.txt`);
            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('fileTooLarge');
        });
    });

    describe('PUT /content', () => {
        afterEach(() => jest.clearAllMocks());

        it('Everything ok', async () => {
            getTargetPath.mockResolvedValue('/home/file.txt');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false
            });
            fs.promises.writeFile.mockResolvedValue();
            fs.promises.rename.mockResolvedValue();

            const response = await request(app).put(`${API_URL}/content`).send({
                path: '/file.txt',
                content: 'new content'
            });

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('Target is directory', async () => {
            getTargetPath.mockResolvedValue('/home/folder');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => true
            });

            const response = await request(app).put(`${API_URL}/content`).send({
                path: '/folder',
                content: 'new content'
            });

            expect(response.statusCode).toBe(400);
            expect(response.body.message).toBe('notAFile');
        });
    });
});
