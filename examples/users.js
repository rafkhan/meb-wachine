'use strict';

var _ = require('lodash');
var Meb = require('../meb');
var MebApp = Meb.App;

var userData = [
  { name: 'Raf', age: '18' },
  { name: 'Tristan', age: '19' },
  { name: 'Josh', age: '22' },
  { name: 'Matt', age: '22' },
  { name: 'Matt', age: '26' }
];

var app = new MebApp();

var allUsersResource = {
  path: '/users',
  handleOk: function() {
    return userData;
  } 
};

var userNameResource = {
  path: '/users/name/:name',
  exists: function(ctx, urlParams, req) {
    var nameQuery = urlParams[0];
    var users = _.filter(userData, function(user) {
      if(user.name === nameQuery) {
        return true;
      }

      return false;
    });

    if(users.length > 0) {
      return ctx.set('users', users);
    }

    return false;
  },

  handleOk: function(ctx) {
    return ctx.toJS();
  }
};

app.resource(allUsersResource);
app.resource(userNameResource);

var server = app.getServer();
console.log('Starting web server on localhost:3333');
server.listen(3333);

/*
 * $ curl localhost:3333/users/name/Raf
 *   => [{"name":"Raf","age":"18"}]
 */
