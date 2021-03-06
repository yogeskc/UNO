var express = require('express');
var router = express.Router();
const { isAuthed, notAuthed } = require('../middleware/auth');

router.get('/', (req, res, next) => {
  res.render('index', { title: 'Home', user: req.user });
});

router.get('/login', notAuthed, (req, res, next) => {
  res.render('login', { title: 'Login', user: req.user });
});

router.get('/register', notAuthed, (req, res, next) => {
  res.render('register', { title: 'Register', user: req.user });
});

router.get('/dashboard', isAuthed, (req, res, next) => {
  res.render('dashboard', { title: 'Dashboard', user: req.user });
});

module.exports = router;
