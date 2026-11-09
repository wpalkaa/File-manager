const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const fileController = require('../../src/controllers/fileController');
const { isNameValid, getTargetPath, calculateDirectorySize } = require('../../src/utils/files');

jest.mock('fs', () => ({ // tworzy obiekt fs
    promises: {
        access: jest.fn(),
        readdir: jest.fn(),
        stat: jest.fn(),
        rename: jest.fn(),
        rm: jest.fn(),
        mkdir: jest.fn(),
        writeFile: jest.fn(),
        readFile: jest.fn()
    }
}));

jest.mock('../../src/utils/files');

jest.mock('archiver', () => { // archiver to funkcja wiec trzeba zrobić mocka funkcji by zwracała obiekt arwchiwum
    return jest.fn().mockImplementation(() => ({
        pipe: jest.fn(),
        directory: jest.fn(),
        finalize: jest.fn()
    }));
});





describe('Files controller', () => {
    let req, res;

    beforeEach(() => {

        req = { body: {} };
        res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
        download: jest.fn(),
        attachment: jest.fn(),
        setHeader: jest.fn(),
        sendFile: jest.fn(),
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    })

    describe('listFiles', () => {
        it('Everything ok', async () => {
            req.body.path = '/';
            
            getTargetPath.mockReturnValue('/home');
            fs.promises.access.mockResolvedValue(undefined);
            fs.promises.readdir.mockResolvedValue(['p1.txt', 'p2.txt']);
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 1024,
                mtime: new Date(),
                birthtime: new Date(),
            });

            await fileController.listFiles(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                files: expect.arrayContaining([
                    expect.objectContaining({ name: 'p1.txt', size: 1024 }),
                    expect.objectContaining({ name: 'p2.txt', size:1024 })
                ])
            }));
        });

        it('Target directory does not exist', async () => {
            req.body.path = '/jsyraethrhw';
            
            getTargetPath.mockRejectedValue({ status: 404, message: 'fileDoesNotExist'})
            await fileController.listFiles(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'fileDoesNotExist'
            }));
        });

        it('Target is file', async () => {
            req.body.path = '/p1.txt';

            getTargetPath.mockReturnValue('/home/p1.txt');
            fs.promises.readdir.mockRejectedValue(new Error('Not directory'));

            await fileController.listFiles(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'notADirectory'
            }));
        });
    });

    describe('getFileInfo', () => {
        it('Everything ok - file', async () => {
            req.body.path = '/p1.txt';

            getTargetPath.mockReturnValue('/home/p1.txt');
            fs.promises.stat.mockResolvedValue({
                name: 'p1.txt',
                type: 'txt',
                isDirectory: () => false,
                size: 67
            });

            await fileController.getFileInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                directory: '/p1.txt',
                fileInfo: expect.objectContaining({ name: 'p1.txt', type: '.txt' })
            }));
        });

        it('Everything ok - directory', async () => {
            req.body.path = '/d1';

            getTargetPath.mockReturnValue('/home/d1');
            calculateDirectorySize.mockReturnValue(6767)
            fs.promises.stat.mockResolvedValue({
                name: 'd1',
                type: '',
                isDirectory: () => true,
                size: 6767
            });

            await fileController.getFileInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                directory: '/d1',
                fileInfo: expect.objectContaining({ name: 'd1', type: '' })
            }));
        });

        it('Server error', async () => {
            req.body.path = '/d1';

            fs.promises.stat.mockRejectedValue(new Error());

            await fileController.getFileInfo(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'server'
            }));
        });
    });

  

    describe('createFile', () => {
        it('Everything ok - file', async () => {
            req.body = { path: '/', name: 'new.txt', isDirectory: false };
            
            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValue('/home/new.txt');

            await fileController.createFile(req, res);

            expect(fs.promises.writeFile).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'File has been created'
            }));
        });

        it('Everything ok - directory', async () => {
            req.body = { path: '/', name: 'new', isDirectory: true };
            
            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValue('/home/new');

            await fileController.createFile(req, res);

            expect(fs.promises.mkdir).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'File has been created'
            }));
        });

        it('Invalid name', async () => {
            req.body = { path: '/', name: '<><><><!#$.txt', isDirectory: false };
            
            isNameValid.mockReturnValue(false);
    
            await fileController.createFile(req, res);
    
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'File name is not allowed'
                }));
        });

        it('File already exists', async () => {
            req.body = { path: '/', name: 'p1.txt', isDirectory: false };
            
            isNameValid.mockReturnValue(true);
            getTargetPath.mockRejectedValue({ status: 409, message: "fileExists" });
      
            await fileController.createFile(req, res);
      
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                 message: 'fileExists'
                }));
        });

        it('Some server error', async () => {
            req.body = { path: '/', name: 'new', isDirectory: true };
            
            getTargetPath.mockReturnValue('/home/new')
            fs.promises.mkdir.mockRejectedValue(new Error(''));
    
            await fileController.createFile(req, res);
    
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "server"
            });
        });
    });



    describe('deleteFile', () => {
        it('Everything ok', async () => {
            req.body.path = '/p1.txt';
            
            getTargetPath.mockReturnValue('/home/p1.txt')
            fs.promises.access.mockResolvedValue(undefined);
    
            await fileController.deleteFile(req, res);
    
            expect(fs.promises.rm).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "File has been deleted"
            });
        });

        it('File does not exist', async () => {
            req.body.path = '/p1.txt';
            
            getTargetPath.mockRejectedValue({ status: 404, message: "fileDoesNotExist" });
    
            await fileController.deleteFile(req, res);
    
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "fileDoesNotExist"
            });
        });

        it('Server error', async () => {
            req.body.path = '/p1.txt';
            
            getTargetPath.mockRejectedValue(new Error());
    
            await fileController.deleteFile(req, res);
    
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: "server"
            });
        });
    });



    describe('downloadFile', () => {
        it('Everything ok - file', async () => {
            req.body.path = '/p1.txt';
            const mockPath = '/home/p1.txt'

            getTargetPath.mockResolvedValue(mockPath);
            fs.promises.stat.mockResolvedValue({ isDirectory: () => false });

            await fileController.downloadFile(req, res);

            expect(res.download).toHaveBeenCalledWith(mockPath);
        });

        it('Everything ok - directory', async () => {
            req.body.path = '/d1';
            const mockPath = '/home/d1';
            const arch = {
                pipe: jest.fn(),
                directory: jest.fn(),
                finalize: jest.fn()
            }

            getTargetPath.mockResolvedValue(mockPath);
            fs.promises.stat.mockResolvedValue({ isDirectory: () => true });
            archiver.mockReturnValue(arch)


            await fileController.downloadFile(req, res);

            expect(res.attachment).toHaveBeenCalledWith('d1.zip');
            expect(archiver).toHaveBeenCalledWith('zip', expect.any(Object));
            expect(arch.pipe).toHaveBeenCalledWith(res);
            expect(arch.directory).toHaveBeenCalledWith(mockPath, false);
            expect(arch.finalize).toHaveBeenCalled();
        });

        it('Some error', async () => {
            getTargetPath.mockRejectedValue(new Error());

            await fileController.downloadFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'server' }));
        });
    });

    describe('getSize', () => {
        it('Everything ok - file', async () => {
            req.body.path = '/p1.txt';
            const mockPath = '/home/p1.txt';

            getTargetPath.mockResolvedValue(mockPath);

            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 2137
            });

            await fileController.getSize(req, res);

            expect(fs.promises.stat).toHaveBeenCalledWith(mockPath);
            expect(calculateDirectorySize).not.toHaveBeenCalled(); 
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                size: 2137
            }));
        });

        it('Everythin ok - directory', async () => {
            req.body.path = '/d1'
            const mockPath = '/home/d1';

            getTargetPath.mockResolvedValue(mockPath);

            fs.promises.stat.mockResolvedValue({
                isDirectory: () => true,
                size: 0
            });

            calculateDirectorySize.mockResolvedValue(997997);

            await fileController.getSize(req, res);

            expect(calculateDirectorySize).toHaveBeenCalledWith(mockPath);
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                size: 997997
            }));
        });

        it('File does not exist', async () => {
            req.body.path = '/graeahteahte.txt';

            getTargetPath.mockRejectedValue({ status: 404, message: 'fileDoesNotExist' });

            await fileController.getSize(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'fileDoesNotExist'
            }));
        });

        it('Some server error', async () => {
            req.body.path = '/p1.txt';
            
            getTargetPath.mockResolvedValue('/home/p1.txt');

            fs.promises.stat.mockRejectedValue(new Error());

            await fileController.getSize(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'server' 
            }));
        });
    })


    describe('renameFile', () => {
        beforeEach(() => {
            req = { 
                body: { 
                    path: '/old.txt',
                    newName: 'new.txt'
                } 
            };
        });

        it('Everything ok', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValueOnce('/home/old.txt')
            getTargetPath.mockResolvedValueOnce('/home/new.txt')

            fs.promises.rename.mockResolvedValue();

            await fileController.renameFile(req, res);

            expect(fs.promises.rename).toHaveBeenCalledWith('/home/old.txt', expect.stringContaining('new.txt'));
            
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'File name has been changed'
            }));
        });

        it('Invalid name given', async () => {
            isNameValid.mockReturnValue(false);

            await fileController.renameFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(fs.promises.rename).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'File name is not allowed'
            }));
        });

        it('File does not exist', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockRejectedValue({ status: 404, message: 'fileDoesNotExist' });

            await fileController.renameFile(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(fs.promises.rename).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'fileDoesNotExist'
            }));
        });

        it('File already exists', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValueOnce('/home/old.txt')
            getTargetPath.mockRejectedValueOnce({ status: 409, message: 'fileExists' });

            await fileController.renameFile(req, res);

            expect(res.status).toHaveBeenCalledWith(409);
            expect(fs.promises.rename).not.toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'fileExists'
            }));
        });

        it('Some server error', async () => {
            isNameValid.mockReturnValue(true);
            getTargetPath.mockResolvedValueOnce('/home/old.txt')
            getTargetPath.mockResolvedValueOnce('/home/new.txt');

            fs.promises.rename.mockRejectedValue(new Error());

            await fileController.renameFile(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'server'
            }));
        });
    });

    describe('getRawFile', () => {
        it('Everything ok - image file', async () => {
            req.query = { path: '/image.png' };
            getTargetPath.mockResolvedValue('/home/image.png');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
            });

            await fileController.getRawFile(req, res);

            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
            expect(res.sendFile).toHaveBeenCalled();
        });

        it('Target is directory', async () => {
            req.query = { path: '/photos' };
            getTargetPath.mockResolvedValue('/home/photos');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => true,
            });

            await fileController.getRawFile(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'notAFile'
            }));
        });
    });

    describe('getFileContent', () => {
        it('Everything ok - text file', async () => {
            req.query = { path: '/notes.txt' };
            getTargetPath.mockResolvedValue('/home/notes.txt');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 100,
                mtime: new Date()
            });
            fs.promises.readFile.mockResolvedValue('Hello World');

            await fileController.getFileContent(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                content: 'Hello World'
            }));
        });

        it('File too large', async () => {
            req.query = { path: '/huge.txt' };
            getTargetPath.mockResolvedValue('/home/huge.txt');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false,
                size: 10 * 1024 * 1024,
                mtime: new Date()
            });

            await fileController.getFileContent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'fileTooLarge'
            }));
        });
    });

    describe('saveFileContent', () => {
        it('Everything ok', async () => {
            req.body = { path: '/notes.txt', content: 'Updated' };
            getTargetPath.mockResolvedValue('/home/notes.txt');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => false
            });
            fs.promises.writeFile.mockResolvedValue();
            fs.promises.rename.mockResolvedValue();

            await fileController.saveFileContent(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'File content saved'
            }));
        });

        it('Cannot save to directory', async () => {
            req.body = { path: '/folder', content: 'Updated' };
            getTargetPath.mockResolvedValue('/home/folder');
            fs.promises.stat.mockResolvedValue({
                isDirectory: () => true
            });

            await fileController.saveFileContent(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: false,
                message: 'notAFile'
            }));
        });
    });
});
