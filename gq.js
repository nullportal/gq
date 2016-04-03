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
        topRuncoms: function (shell, callback) {

            // TODO add these to composite and return to end user
            if (typeof shell !== 'string')
                throw new Error("Invalid type " + typeof shell);
            if (shell.length > 10)
                throw new Error("Shell name too long " + shell.length);
            if (shell.length < 3)
                throw new Error("Shell name too short " + shell.length);
            if (! shell.match(/[a-zA-Z0-9]/))
                throw new Error("Shell name contains non alphanumeric chars");

            shell = shell + 'rc'; // TODO only add rc if missing

            request({
                url: base
                  + 'search/repositories?q='
                  + 'file:.' + shell
                  + '+file:' + shell
                  + '&sort=stars&order=desc'
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

                callback(composite);
            });
        }
    };

    /*
     * Private functions
     */
    function _buildComposite(obj) {

        // first, build a safe default
        var composite = {
            error: true,
            status: 666,
            summary: '',
            message: '',
            body: [null],
            count: 0
        };

        // error is always valid or null
        composite.error   = obj.error;

        // HTTP status code
        composite.status  = obj.response.statusCode;

        // possible results are 0 or greater
        composite.count   = obj.body.total_count;

        // even successful queries can return 0 matches
        composite.message = _buildMessage(obj).message;
        composite.summary = _buildMessage(obj).summary;

        // load only first ten matching repositories
        composite.body    = obj.body.items.slice(0, 10);

        return composite;
    }

    function _buildMessage(obj) {
        var count = obj.body.total_count;
        var message = '';
        var summary = '';

        if (count < 1) {
            summary = 'Failure';
            message = 'No matches found';
        } else {
            summary = 'Success';
            message = count + ' matches found'
              + ' - displaying top'
              + ' '
              + (count < 10 ? count : '10');
        }

        return {
            message: message,
            summary: summary
        };
    }
}

module.exports = gq();

