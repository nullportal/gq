'use strict';

var url = require('url');
var request = require('request');

var base = 'https://api.github.com/';

function gq() {

    return {
        topRuncoms: function (shell, callback) { // TODO validate
            shell = shell + 'rc'; // TODO only add rc if missing

            request({
                url: base
                  + 'search/repositories?q='
                  + shell
                  + '+language:shell&sort=stars&order=desc'
                  + '&page=1',
                json: true,
                headers: {
                    'User-Agent': 'comp74-student'
                }
            }, function (error, response, body) {
                if (! error) {
                    error = null;
                    body  = body.items.slice(0, 10); // top ten
                }
                callback({
                    error:  error,
                    body:   body,
                    status: response.statusCode
                });
            });
        }
    };
}

module.exports = gq();

