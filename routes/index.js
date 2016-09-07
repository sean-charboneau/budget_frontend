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

/* GET login page. */
router.get('/', function(req, res) {
	if(req.cookies && req.cookies['seanBudgetToken']) {
		return res.redirect('/home');
	}
	// Display the Login page with any flash message, if any
	res.render('index');
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
router.get('/register', function(req, res){
	res.render('register');
});

/* Handle Registration POST */
router.post('/register', function(req, res) {
	request.post({url: config.get('api.hostname') + '/register', form: req.body}, function(err, httpResponse, body) {
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

/* GET Home Page */
router.get('/home', authenticate, function(req, res) {
	console.log('PAGE');
	console.log(req.cookies['seanBudgetToken']);
	request.get({url: config.get('api.hostname') + '/me', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err || !body) {
			console.log(err);
			console.log(body);
			return res.redirect('/');
		}
		console.log(JSON.parse(body));
		
		return res.render('home', { user: JSON.parse(body) });
	})
});

/* Handle Logout */
router.get('/signout', function(req, res) {
	req.logout();
	res.redirect('/');
});

module.exports = router;