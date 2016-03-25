'use strict';

var url = require('url');
var request = require('request');

var base = 'https://api.github.com/';
var user = process.argv[2];

console.log('querying', user);


request({
    url: base + 'users/' + user,
    json: true,
    headers: {
        'User-Agent': 'student'
    }
}, function (error, response, body) {

    if (! error && response.statusCode === 200) {

        var f1 = body.followers < 1 ? 1: body.followers;
        var f2 = body.following < 1 ? 1: body.following;
        var fRatio = (f1 / f2).toPrecision(2)

        var out = 'name:\t\t'   + body.name
          + '\nlogin:\t\t'      + body.login
          + '\nemail:\t\t'      + body.email
          + '\ncompany:\t'      + body.company
          + '\nlocation:\t'     + body.location
          + '\nfollow ratio:\t' + fRatio;

        console.log(out);

    } else if (! error) {

        console.log('status:\t\t%j', response.statusCode);
        console.log('status:\t\t%j', body.message);

    } else {

        console.error('error: %s', error);
    }
});


