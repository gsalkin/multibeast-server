const express = require('express');
const routes = express.Router();
const auth =  require('./api')
const api = require('./auth')

routes.use(auth);
routes.use(api);

module.exports = routes;