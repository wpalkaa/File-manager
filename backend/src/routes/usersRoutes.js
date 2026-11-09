const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const verifyAdmin = require('../middleware/verifyAdmin');

router.get('/', usersController.getUsers);
router.get('/:login', usersController.getUserData);

router.delete('/delete/:id', verifyAdmin, usersController.deleteUser);
router.delete('/delete/noauth/:id', usersController.deleteUser);

router.patch('/:id', verifyAdmin, usersController.updateUser);
router.patch('/edit/:id', verifyAdmin, usersController.updateUser);

router.post('/create', verifyAdmin, usersController.createUser);


module.exports = router;
