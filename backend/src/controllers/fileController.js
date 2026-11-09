const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const fileSystemPath = path.join(__dirname, "../../fileSystem/home");
const { isNameValid, getTargetPath, calculateDirectorySize } = require('../utils/files');

let publishFileEvent = () => {};
try {
    const mqttModule = require('../mqtt');
    if (mqttModule && mqttModule.publishFileEvent) {
        publishFileEvent = mqttModule.publishFileEvent;
    }
} catch (e) {}

let redisService = null;
try {
    redisService = require('../services/redisService');
} catch (e) {}

const MIME_TYPES = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8'
};

exports.listFiles = async (req, res) => {
    const { path: requestPath = '' } = req.body;
    console.log('[Debug]: Received path:', requestPath);
    console.log(`[Info]: Received request to list files in directory: ${requestPath !== '/' ? '/home' + requestPath : '/home'}`);
    
    try {
        // Validate request path and get target path
        const targetPath = await getTargetPath(requestPath, fileSystemPath);
        console.log(`[Info]: Request approved - sending files list.`);

        // Read files in the target directory
        const files = await fs.promises.readdir(targetPath);

        // Get detailed info for each file
        const detailedFiles = await Promise.all(
            files.map( async (fileName) => {
                const filePath = path.join(targetPath, fileName);
                const stats = await fs.promises.stat(filePath);

                let totalSize = 0;
                if( !stats.isDirectory() ) {
                    totalSize = stats.size;
                } else {
                    /* istanbul ignore next */
                    totalSize = await calculateDirectorySize(filePath);
                };

                return {
                    name: fileName,
                    type: path.extname(fileName),
                    isDirectory: stats.isDirectory(),
                    size: totalSize,
                    lastModified: stats.mtime,
                    birthTime: stats.birthtime,
                };
            })
        );

        res.status(200).json({
            success: true,
            directory: requestPath,
            files: detailedFiles
        });
    } catch (error) {
        if (error.code === 'ENOTDIR' || error.message === 'Not directory' || (error.message && error.message.toLowerCase().includes('not a directory'))) {
            return res.status(400).json({
                success: false,
                message: 'notADirectory'
            });
        }
        if(!error.status) console.error(`[Error]: Couldn't read directory:\n${error}`);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    };
};

exports.getFileInfo = async (req, res) => {
    const { path: requestPath = '' } = req.body;
    console.log('[Debug]: Received path:', requestPath);
    console.log(`[Info]: Received request to send info of file: ${requestPath !== '/' ? '/home' + requestPath : '/home'}`);

    try {
        // Validate request path and get target path
        const targetPath = await getTargetPath(requestPath, fileSystemPath);
        console.log(`[Info]: Request approved - sending file info.`)

        const stats = await fs.promises.stat(targetPath);
        const fileName = path.basename(targetPath);

        let totalSize = 0;
        if( !stats.isDirectory() ) {
            totalSize = stats.size;
        } else {
            /* istanbul ignore next */
            totalSize = await calculateDirectorySize(targetPath);
        };

        const fileInfo = {
            name: fileName,
            type: path.extname(fileName),
            isDirectory: stats.isDirectory(),
            size: totalSize,
            lastModified: stats.mtime,
            birthTime: stats.birthtime,
        };

        res.status(200).json({
            success: true,
            directory: requestPath,
            fileInfo: fileInfo
        });
    } catch (error) {
        if(!error.status) console.error(`[Error]: Couldn't read directory:\n${error}`);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    };
};

exports.getSize = async (req, res) => {
    const { path: requestPath = '' } = req.body;
    console.log('[Debug]: Received path:', requestPath);
    console.log(`[Info]: Received request to get size of file: ${requestPath !== '/' ? '/home' + requestPath : '/home'}`);
    
    try {
        // Validate request path and get target path
        const targetPath = await getTargetPath(requestPath, fileSystemPath);
        console.log("[Info]: Request approved - sending file size.");

        let totalSize = 0;
        const fileStats = await fs.promises.stat(targetPath);

        // If directory, calculate size recursively
        if( !fileStats.isDirectory() ) {
            totalSize = fileStats.size;
        } else {
            const cached = redisService ? await redisService.getDirSize(targetPath) : null;
            if (cached !== null && cached !== undefined) {
                totalSize = cached;
            } else {
                /* istanbul ignore next */
                totalSize = await calculateDirectorySize(targetPath);
                if (redisService) await redisService.setDirSize(targetPath, totalSize);
            }
        }

        res.status(200).json({
            success: true,
            size: totalSize
        });
    } catch (error) {
        if(!error.status) console.error(`[Error]: Couldn't read directory:\n${error}`);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    };
};

exports.downloadFile = async( req, res ) => {
    const { path: requestPath = '' } = req.body;
    console.log(`[Info]: Received download request for: ${requestPath !== '/' ? '/home' + requestPath : '/home'}`);

    try {
        // Validate request path and get target path
        const targetPath = await getTargetPath(requestPath, fileSystemPath);
        console.log(`[Info]: Request approved - sending file.`);

        // If target is directory, zip it
        const stats = await fs.promises.stat(targetPath);

        if( stats.isDirectory() ) {
            const fileName = path.basename(requestPath);
            res.attachment(`${fileName}.zip`);

            const archive = archiver("zip", {
                zlib: {level: 4}
            });

            archive.pipe(res);
            archive.directory(targetPath, false);
            archive.finalize();
        } else {
            res.download(targetPath);
        };
    } catch (error) {
        if(!error.status) console.error(`[Error]: Couldn't download directory:\n${error}`);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    }
};

exports.renameFile = async( req, res ) => {
    const { path: requestPath = '' } = req.body;
    const { newName } = req.body;
    console.log(`Info: Received rename request for: ${requestPath !== '/' ? '/home' + requestPath : '/home'} => ${newName}`);

    try {
        // Validate file name
        if( !isNameValid(newName) ) {
            console.error(`[Error]: Request rejected - new name is not allowed.`);
            return res.status(400).json({
                success: false,
                message: 'File name is not allowed'
            });
        }
        // Validate request path and get target path
        const targetPath = await getTargetPath(requestPath, fileSystemPath);  // fileSystem + requestPath
        
        // New target path
        const targetDirname = path.dirname(targetPath)  // fileSystem + requestDirectory
        const newTargetPath = path.join(targetDirname, newName);

        // Validate new target path
        const pathToRenamedFile = path.relative( fileSystemPath, newTargetPath );
        await getTargetPath( pathToRenamedFile, fileSystemPath, { mustExist: false } );
        
        console.log("[Info]: Request approved - renaming file...");

        // Rename
        await fs.promises.rename(targetPath, newTargetPath);

        if (redisService) await redisService.invalidateDirSize(targetPath);
        publishFileEvent({ action: 'rename', path: requestPath, target: newName });
        
        res.status(200).json({
            success: true,
            message: 'File name has been changed'
        });
    } catch (error) {
        if(!error.status) console.error(`[Error]: Couldn't rename directory:\n${error}`);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    }
};

exports.deleteFile = async( req, res ) => {
    const { path: requestPath = '' } = req.body;
    console.log(`[Info]: Received delete request for: ${requestPath !== '/' ? '/home' + requestPath : '/home'}`);

    try {
        // Validate request path and get target path
        const targetPath = await getTargetPath(requestPath, fileSystemPath);  // fileSystem + requestPath

        console.log(`[Info]: request approved - deleting file...`);
        
        // Delete
        await fs.promises.rm(targetPath, { recursive: true });

        if (redisService) await redisService.invalidateDirSize(targetPath);
        publishFileEvent({ action: 'delete', path: requestPath, target: path.basename(requestPath) });
        
        res.status(200).json({
            success: true,
            message: 'File has been deleted'
        });
    } catch (error) {
        if(!error.status) console.error(`[Error]: Couldn't delete file:\n${error}`);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    }
};

exports.createFile = async( req, res ) => {
    const { path: requestPath = '', name: fileName, isDirectory } = req.body;
    console.log(`[Info]: Received create file request in ${requestPath !== '/' ? '/home' + requestPath : '/home'}, with name: ${fileName}`);

    try {
        // Validate file name
        if( !isNameValid(fileName) ) {
            console.error(`[Error]: Request rejected - new name is not allowed.`);
            return res.status(400).json({
                success: false,
                message: 'File name is not allowed'
            });
        };

        // Validate request path 
        const filePath = `${requestPath}/${fileName}`;
        console.log(`[Debug]: filePath: ${filePath}`);
        const targetPath = await getTargetPath(filePath, fileSystemPath, { mustExist: false }); 

        console.log(`[Info]: request approved - creating a new file.`);

        // Create
        if( isDirectory ) await fs.promises.mkdir(targetPath);
        else await fs.promises.writeFile(targetPath, '');

        if (redisService) await redisService.invalidateDirSize(targetPath);
        publishFileEvent({ action: 'create', path: requestPath, target: fileName, isDirectory });

        res.status(200).json({
            success: true,
            message: 'File has been created'
        });
    } catch (error) {
        if(!error.status) console.error(`[Error]: Couldn't create file:\n${error}`);
        res.status( error.status || 500 ).json({
            success: false,
            message: error.message || 'server'
        });
    }
};

exports.getRawFile = async (req, res) => {
    const requestPath = req.query.path || req.body.path || '';
    try {
        const targetPath = await getTargetPath(requestPath, fileSystemPath);
        const stats = await fs.promises.stat(targetPath);
        if (stats.isDirectory()) {
            return res.status(400).json({ success: false, message: 'notAFile' });
        }

        const ext = path.extname(targetPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        if (typeof fs.createReadStream === 'function') {
            const stream = fs.createReadStream(targetPath);
            stream.pipe(res);
        } else {
            res.sendFile(path.resolve(targetPath));
        }
    } catch (error) {
        if (!error.status) console.error(`[Error]: Couldn't get raw file:\n${error}`);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'server'
        });
    }
};

exports.getFileContent = async (req, res) => {
    const requestPath = req.query.path || req.body.path || '';
    try {
        const targetPath = await getTargetPath(requestPath, fileSystemPath);
        const stats = await fs.promises.stat(targetPath);
        if (stats.isDirectory()) {
            return res.status(400).json({ success: false, message: 'notAFile' });
        }
        if (stats.size > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'fileTooLarge' });
        }

        const content = await fs.promises.readFile(targetPath, 'utf8');
        res.status(200).json({
            success: true,
            content,
            size: stats.size,
            lastModified: stats.mtime
        });
    } catch (error) {
        if (!error.status) console.error(`[Error]: Couldn't read file content:\n${error}`);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'server'
        });
    }
};

exports.saveFileContent = async (req, res) => {
    const { path: requestPath = '', content = '' } = req.body;
    try {
        const targetPath = await getTargetPath(requestPath, fileSystemPath);
        const stats = await fs.promises.stat(targetPath);
        if (stats.isDirectory()) {
            return res.status(400).json({ success: false, message: 'notAFile' });
        }

        const tempPath = `${targetPath}.tmp_${Date.now()}`;
        await fs.promises.writeFile(tempPath, content, 'utf8');
        await fs.promises.rename(tempPath, targetPath);

        if (redisService) await redisService.invalidateDirSize(targetPath);
        publishFileEvent({ action: 'modify', path: requestPath, target: path.basename(requestPath) });

        res.status(200).json({
            success: true,
            message: 'File content saved'
        });
    } catch (error) {
        if (!error.status) console.error(`[Error]: Couldn't save file content:\n${error}`);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'server'
        });
    }
};
