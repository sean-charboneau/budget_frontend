var config = require('config');
var express = require('express');
var request = require('request');
var router = express.Router();

var authenticate = function(req, res, next) {
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
			return res.json({error: 'Invalid login'});
		}
		var bodyObj = JSON.parse(body);
		bodyObj.cookie = httpResponse.headers['set-cookie'][0];
		return res.json(bodyObj);
	});
});

/* GET Cash Page */
router.get('/cash', authenticate, function(req, res) {
	var currency = require('../data/currency.json');
	var countries = require('../data/countries.json');
	return res.render('cash', {currency: JSON.stringify(currency), countries: JSON.stringify(countries)});
});

router.get('/createTrip', authenticate, function(req, res) {
	request.get({url: config.get('api.hostname') + '/tripOverview', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err || !body) {
			return logOut(req, res, {error: 0});
		}
		var trip = JSON.parse(body);
		if(trip.message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		if(trip.tripId) {
			return res.redirect('/home');
		}
		request.get({url: config.get('api.hostname') + '/me', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
			if(err || !body) {
				return logOut(req, res, {error: 0});
			}
			if(JSON.parse(body).message == 'jwt expired') {
				return logOut(req, res, {error: 1});
			}
			
			var currency = require('../data/currency.json');
			var countries = require('../data/countries.json');
			return res.render('createTrip', { user: body, trip: JSON.stringify(trip), currency: JSON.stringify(currency), countries: JSON.stringify(countries) });
		});
	});
});

router.get('/tripOverview', authenticate, function(req, res) {
	request.get({url: config.get('api.hostname') + req.originalUrl, headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		
		return res.json(body);
	});
});

router.get('/withdrawal', authenticate, function(req, res) {
	request.get({url: config.get('api.hostname') + req.originalUrl, headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		
		return res.json(body);
	});
});

router.post('/trip', authenticate, function(req, res) {
	request.post({url: config.get('api.hostname') + '/trip', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}, form: req.body}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}

		return res.json(body);
	});
});

router.post('/withdrawal', authenticate, function(req, res) {
	request.post({url: config.get('api.hostname') + '/withdrawal', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}, form: req.body}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}

		return res.json(body);
	});
});

router.post('/transaction', authenticate, function(req, res) {
	request.post({url: config.get('api.hostname') + '/transaction', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}, form: req.body}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}

		return res.json(body);
	});
});

/* GET Transactions Page */
router.get('/transactions', authenticate, function(req, res) {
	var currency = require('../data/currency.json');
	var countries = require('../data/countries.json');
	return res.render('transactions', {currency: JSON.stringify(currency), countries: JSON.stringify(countries)});
});

router.get('/transaction', authenticate, function(req, res) {
	request.get({url: config.get('api.hostname') + req.originalUrl, headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		
		return res.json(body);
	});
});

router.get('/categories', authenticate, function(req, res) {
	request.get({url: config.get('api.hostname') + '/categories', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		
		return res.json(body);
	});
});

router.get('/cashReserves', authenticate, function(req, res) {
	request.get({url: config.get('api.hostname') + '/cashReserves', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err) {
			return res.json({error: err});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		
		return res.json(body);
	});
});

/* GET Home Page */
router.get('/home', authenticate, function(req, res) {
	var currency = require('../data/currency.json');
	var countries = require('../data/countries.json');
	request.get({url: config.get('api.hostname') + '/me', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err || !body) {
			return logOut(req, res, {error: 0});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}

		return res.render('home', {user: body, currency: JSON.stringify(currency), countries: JSON.stringify(countries)});
	});
});

router.get('/profile', authenticate, function(req, res) {
	request.get({url: config.get('api.hostname') + '/me', headers: {'Authorization': 'Bearer ' + req.cookies['seanBudgetToken']}}, function(err, httpResponse, body) {
		if(err || !body) {
			return logOut(req, res, {error: 0});
		}
		if(JSON.parse(body).message == 'jwt expired') {
			return logOut(req, res, {error: 1});
		}
		
		return res.render('profile', { user: JSON.parse(body) });
	});
});

/* Handle Logout */
router.get('/signout', function(req, res) {
	req.logout();
	res.redirect('/');
});

module.exports = router;