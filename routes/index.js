var express = require('express');
var router = express.Router();

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

/* GET login page. */
router.get('/', function(req, res) {
	// if(req.isAuthenticated()) {
	// 	return res.redirect('/home');
	// }
	// Display the Login page with any flash message, if any
	res.render('index');
});

/* Handle Login POST */
router.post('/login', function(req, res) {
	console.log(req.body);
	return res.redirect('/');
});
// router.post('/login', passport.authenticate('login', {
// 	successRedirect: '/home',
// 	failureRedirect: '/',
// 	failureFlash : true  
// }));

/* GET Registration Page */
router.get('/register', function(req, res){
	res.render('register');
});

/* Handle Registration POST */
// router.post('/register', passport.authenticate('register', {
// 	successRedirect: '/home',
// 	failureRedirect: '/register',
// 	failureFlash : true  
// }));

/* GET Home Page */
router.get('/home', isAuthenticated, function(req, res){
	res.render('home', { user: req.user });
});

/* Handle Logout */
router.get('/signout', function(req, res) {
	req.logout();
	res.redirect('/');
});

module.exports = router;