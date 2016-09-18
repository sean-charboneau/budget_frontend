var config = require('config');
var express = require('express');
var request = require('request');
var router = express.Router();

var redis = require('../redis');

var authenticate = function(req, res, next) {
	// redis.get(config.get('storage.token'), function (err, value) {
	// 	if(err || !value) {
	// 		// if the user is not authenticated then redirect him to the login page
	// 		return res.redirect('/');
	// 	}
	// 	return next();
	// });
	console.log('AUTH');
	console.log(req.cookies);
	if(!req.cookies || !req.cookies['seanBudgetToken']) {
		return res.redirect('/');
	}
	return next();
};

var logOut = function(req, res, opts) {
	res.clearCookie('seanBudgetToken');
	var error = opts.error || 0;
	return res.redirect('/?error=' + error);
}

var ERRORS = {
	0: "",
	1: "Your session has expired, please log in again"
}

/* GET login page. */
router.get('/', function(req, res) {
	var errorCode = req.query.error || 0;
	if(req.cookies && req.cookies['seanBudgetToken'] && !errorCode) {
		return res.redirect('/home');
	}
	// Display the Login page with any flash message, if any
	console.log('MESSAGE: ' + ERRORS[errorCode]);
	res.render('index', {message: ERRORS[errorCode]});
});

/* Handle Login POST */
router.post('/login', function(req, res) {
	request.post({url: config.get('api.hostname') + '/login', form: req.body}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err}); //TODO error flash
		}
		if(httpResponse.statusCode == 401) {
			return res.json({error: 'Invalid login'});
		}
		var bodyObj = JSON.parse(body);
		bodyObj.cookie = httpResponse.headers['set-cookie'][0];
		return res.json(bodyObj);
	});
});

/* GET Registration Page */
router.get('/register', function(req, res) {
	var currency = require('../data/currency.json');
	res.render('register', {currency: JSON.stringify(currency)});
});

/* Handle Registration POST */
router.post('/register', function(req, res) {
	request.post({url: config.get('api.hostname') + '/register', form: req.body}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err}); //TODO error flash
		}
		if(httpResponse.statusCode == 401) {
			console.log(httpResponse);
			return res.json({error: 'Invalid login'});
		}
		var bodyObj = JSON.parse(body);
		bodyObj.cookie = httpResponse.headers['set-cookie'][0];
		return res.json(bodyObj);
	});
});

/* GET Home Page */
router.get('/home', authenticate, function(req, res) {
	var currency = require('../data/currency.json');
	return res.render('home', {currency: JSON.stringify(currency)});
});

router.get('/profile', authenticate, function(req, res) {
	console.log('PAGE');
	console.log(req.cookies['seanBudgetToken']);
	request.get({url: config.get('api.hostname') + '/me', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err || !body) {
			console.log(err);
			console.log(body);
			return logOut(req, res, {error: 0})
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		console.log('all good');
		console.log(JSON.parse(body));
		
		return res.render('profile', { user: JSON.parse(body) });
	});
});

/* Handle Logout */
router.get('/signout', function(req, res) {
	console.log(req.user);
	req.logout();
	res.redirect('/');
});

module.exports = router;