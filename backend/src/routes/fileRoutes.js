const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');

router.post('/listFiles', fileController.listFiles);
router.post('/getSize', fileController.getSize);
router.post('/getFileInfo', fileController.getFileInfo);
router.post('/download', fileController.downloadFile);
router.post('/create', fileController.createFile);

router.get('/raw', fileController.getRawFile);
router.get('/content', fileController.getFileContent);
router.put('/content', fileController.saveFileContent);

router.patch('/rename', fileController.renameFile);

router.delete('/delete', fileController.deleteFile);

module.exports = router;
