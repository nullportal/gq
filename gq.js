'use strict';

var url = require('url');
var request = require('request');

var base = 'https://api.github.com/';

function gq() {


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
                var composite = _buildComposite({
                    error: error,
                    response: response,
                    body: body
                });
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

    /*
     * Private functions
     */
    function _buildComposite(obj) {
        /*XXX*/console.log('_buildComposite', Object.keys(obj));
        // first, build a safe default
        var composite = {
            error: true,
            status: 666,
            message: '',
            body: [null],
            count: 0
        };

        composite.error   = obj.error;
        composite.status  = obj.response.statusCode;
        composite.message = _buildMessage(obj);
        composite.count   = obj.body.total_count;

        return composite;
    }
    function _buildMessage(obj) {

        return 'placeholder';
    }
}

module.exports = gq();

