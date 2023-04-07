
var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
var User = require("../models/user");
var Book = require("../models/book");

const bodyParser = require("body-parser");

var request = require('request');

// // parse requests of content-type - application/json
router.use(bodyParser.json());

const parser = bodyParser.urlencoded({ extended: true });

router.use(parser);

// Create new user
router.post('/signup', async function (req, res) {

    if (!req.body.username || !req.body.password) {
        return res.render('api/signup', { msg: 'Please pass username and password.' });
    } else {
        var newUser = new User({
            username: req.body.username,
            password: req.body.password
        });
        await newUser.save();
        res.redirect('/api/signin');
    }

});

router.get('/signup', (req, res) => {
    res.render('signup', {
    });
});

// Login

router.post('/signin', async function (req, res, next) {

    let user = await User.findOne({ username: req.body.username });
    if (!user) {
        res.status(401).render('signin', { msg: 'Tài khoản không tồn tại.' });
    } else {
        user.comparePassword(req.body.password, function (err, isMatch) {
            if (isMatch && !err) {
                var token = jwt.sign(user.toJSON(), config.secret);

                request.get({
                    headers: { 'Authorization': 'JWT ' + token }
                    , url: 'http://localhost:3000/api/book'
                }, function (error, response, body) {
                    res.send(body);
                });

                // res.set({
                //     'Authorization': 'JWT ' + token
                // });

                //res.header('Authorization', 'JWT ' + token);

                // res.cookie("token", 'JWT ' + token, {
                //     maxAge: 60000
                // });

                // res.header['Authorization'] = 'JWT ' + token;

                // console.log('Header: ' + res.header['Authorization']);

                // res.redirect('/api/book');

                //next();

                // return res.header({ "Authorization": token }).redirect('/api/book');
            } else {
                res.status(401).render('signin', { msg: 'Mật khẩu không đúng.' });
            }
        });
    }
});

router.get('/signin', (req, res) => {
    res.render('signin', {
    });
});

// Get List Book

router.get('/book', passport.authenticate('jwt', { session: false }), async function (req, res) {

    console.log('Vao get api/book')
    console.log(req.header['Authorization']);
    var token = getToken(req.headers);

    console.log(token);
    if (token) {
        let booklist = await Book.find();
        res.render('bookList', {
            booklist: booklist.map(booklist => booklist.toJSON())
        });

        console.log(booklist)
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized 123.' });
    }
});

router.post('/book', passport.authenticate('jwt', { session: false }), function (req, res) {

    console.log('Vao post api/book')

    var token = getToken(req.headers);
    if (token) {
        console.log(req.body);
        var newBook = new Book({
            title: req.body.title,
            author: req.body.author,
        });

        newBook.save(function (err) {
            if (err) {
                return res.json({ success: false, msg: 'Save book failed.' });
            }
            res.json({ success: true, msg: 'Successful created new book.' });
        });
    } else {
        return res.status(403).send({ success: false, msg: 'Unauthorized 456.' });
    }
});




getToken = function (headers) {
    if (headers && headers.authorization) {
        console.log(headers.authorization);
        var parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};

module.exports = router;
