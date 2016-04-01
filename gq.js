'use strict';

var url = require('url');
var request = require('request');

var base = 'https://api.github.com/';

function gq() {

    var composite = {
        error: true,
        status: 666,
        message: '',
        body: [null],
        count: 0
    };


    return {
        /* TODO
         *   check if there is a file that matches 'shell' pattern before
         *   including in stack.
         */
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
                composite.error   = error;
                composite.status  = response.statusCode;
                composite.message = response.statusMessage;
                composite.count   = body.total_count;
                console.log('%d results [%s]:%s'
                  , composite.count
                  , response.statusCode
                  , response.statusMessage);
                if (! error) {
                    composite.error = error;
                    composite.body  = body.items.slice(0, 10); // top ten
                }
                callback(composite);
            });
        }
    };
}

module.exports = gq();

