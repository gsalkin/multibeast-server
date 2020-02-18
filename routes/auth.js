const express = require('express');
const User = require('../models/user');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const exjwt = require('express-jwt');
const auth = express.Router();

//Authentication routing
const userAuthenticated = exjwt({ secret: process.env.SECRET_TOKEN });

auth.post('/admin/login', async (req, res, next) => {
	passport.authenticate('local-login', async (err, user) => {
		try {
			if (!user) {
				const error = new Error('User not found');
				return next(error);
			}
			req.login(user, { session: false }, async error => {
				if (error) {
					return next(error);
				}
				const body = {
					_id: user._id,
					username: user.username
				};
				const token = jwt.sign(body, process.env.SECRET_TOKEN, {
					expiresIn: 2629746 // expires in 1 month
				});
				res.json({
					success: true,
					token: token,
					user: user.username
				});
			});
		} catch (error) {
			return next(error);
		}
	})(req, res, next);
});

auth.post('/admin/signup', passport.authenticate('local-signup', { session: false }), async (req, res) => {
	res.json({
		message: 'Account Created',
		user: req.user
	});
});

auth.get('/admin/users', userAuthenticated, async (req, res) => {
	await User.find({}, 'username isAdmin', (err, result) => {
		console.log(result);
		res.json(result);
	});
});

module.exports = auth;
