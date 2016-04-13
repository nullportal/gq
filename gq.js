'use strict';

var url = require('url');
var request = require('request');

var base = 'https://api.github.com/';

/*
 * XXX
 *   Consider setting a keep-alive request Agent 
 *   to maintain sockets until individual query completed
 */

var gq = {

    /* 
     * NOTE: prone to "this" injection,
     * but consumer would only hurt themselves.
     */
    shell: null,
    token: process.argv[2],

        /* TODO
         *   Also return direct link to runcom file
         *   with results.
         */
        topRuncoms: function (shell, callback) {

            if (typeof shell !== 'string')
                throw new Error("Invalid type " + typeof shell);
            if (shell.length > 10)
                throw new Error("Shell name too long " + shell.length);
            if (shell.length < 3)
                throw new Error("Shell name too short " + shell.length);
            if (! shell.match(/[a-zA-Z0-9]/))
                throw new Error("Shell name contains non alphanumeric chars");

            if (shell.slice(-2) !== 'rc') {
                this.shell = shell + 'rc';
            } else {
                this.shell = shell;
            }

            /*
             * TODO
             *   Broaden search to include repositories that
             *   contain the shell (minus 'rc').  Missing a
             *   lot of good files right now.
             */
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
                //*XXX*/console.log('Base Query String "%s"', this.req.path);

                var composite = {};

                _buildComposite({
                    error: error,
                    response: response,
                    body: body
                }, function (composite) {
                    console.log('%d results [%s]:%s'
                      , composite.count
                      , response.statusCode
                      , response.statusMessage);

                    composite = composite;
                /*XXX*/console.log('topRuncoms done');
                callback(composite);
                });

            });
        }
    };

    /*
     * Private functions
     */
    function _buildComposite(obj, callback) {

        var composite = {};

        // error is always valid or null
        composite.error   = obj.error;

        // HTTP status code
        composite.status  = obj.response.statusCode;

        // possible results are 0 or greater
        composite.count   = obj.body.total_count;

        // even successful queries can return 0 matches
        composite.message = _buildMessage(obj).message;
        composite.summary = _buildMessage(obj).summary;

        //load only first ten matching repositories
        _buildBody(obj.body.items, function (parsedBody) { // ie. arr 'set'
            /*XXX*/console.log('parsedBody', parsedBody);
            composite.body = parsedBody;

            //*XXX*/console.log('composite.body{', composite.body, '}');
            callback(composite);
        });

        //callback(composite);
    }

    function _buildMessage(obj) {
        var count   = obj.body.total_count;
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

/*
 * XXX big problem:
 *   _buildBody returns multiple times, and then
 *   _getRuncom returns multiple times
 */
    function _buildBody(items, callback) {
        console.log('_buildBody(%s %ss)', items.length, typeof items);

        var limit = 10;
        var set = [];
        // Clamp the items we are assessing at a solid 50 maximum
        items.slice(0, 50);
        //*XXX*/console.log(Object.keys(items[0]));

        /*
         * Define a blank object and copy a stripped down
         * version (just what we need) of the item object's
         * values to it.
         */
        items.forEach(function (item, index, array) {
            var selection = {};
            selection.full_name     = array[index].full_name;
            selection.score         = array[index].score;
            selection.svn_url       = array[index].svn_url;
            selection.description   = array[index].description;

            // XXX temporarity disabled:
            _getRuncom(item, function (runcom) {
                selection.runcom = runcom; // TODO check if null
                set[index] = selection;

                //*XXX*/console.log('%d/%d', index, array.length - 1);
                //*XXX*/console.log('selection=%j',set[index]);
                if (limit <= 0 || index == array.length - 1) { // XXX this never triggers
                    /*XXX*/console.log('_buildBody done');
                    callback(set);
                }
                limit--;
            });
        });
    }

    // XXX this is presently executing AFTER topRuncoms function has sent back the composite object
    function _getRuncom(item, callback) {
        var runcomPattern = new RegExp('^[\\.,dot,_]*' + gq.shell + '$', 'ig');

        var trees_url = item.trees_url.replace('{/sha}', '/' + item.default_branch);
        var runcomFile = null;

        request({
            url: trees_url,
            json: true,
            headers: {
                'User-Agent': 'comp74-student',
                Authorization: 'token 03b098de70648125382888a011ffc49dd322dda4' // XXX REMOVE XXX
            }
        }, function (error, response, body) {
            if (error) throw new Error(error);
            //*XXX*/console.log(response.body.message);
            //*XXX*/console.log('OINK',Object.keys(body).length);
            var len = Object.keys(body).length;

            // TODO if '.bashrc', this is our runcom - move to next
            // TODO if no match in this whole item then return false and try again
            var i     = 0;
            var files = body.tree;
            files.forEach(function (file) { // XXX no safe default if no match
                if (file.path.match(runcomPattern)) {
                    /*XXX*/console.log('file %s matches %s', file.path, runcomPattern);
                    runcomFile = file.path || null;

                } 
                i++;
            });
            /*XXX*/console.log('_getRuncom done with %s', runcomFile);
            callback(runcomFile); // Return matching runcom file
        });

    }


module.exports = gq;

