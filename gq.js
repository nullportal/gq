'use strict';

var url = require('url');
var request = require('request');
var async   = require('async');

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
    done:  false,

        isDone: function () { return this.done; },

        /*
         * Return top 10 public repositories which match
         * the query in some way, and provide a direct link
         * to a matching runcom file, if one is found in the
         * parent directory.
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
                  + '&sort=stars&order=desc'
                  + '&per_page=10',
                json: true,
                headers: {
                    'User-Agent': 'comp74-student'
                }
            }, function (error, response, body) {

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
     * Load an object with relevant data returned
     * from a series of queries to the Github API
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
        if (composite.summary === 'Success') {
            _buildBody(obj.body.items, function (parsedBody, finished) { // ie. arr 'set'
                if (finished) {

                    composite.body = parsedBody;

                    /*XXX*/console.log('_buildComposite() done');

                    callback(composite);
                }
            });
        } else {
            callback(composite);
        }
    }

    /*
     * Build a relevant message to return
     * to the end user
     */
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

    function _buildBody(items, callback) {
        /*XXX*/console.log('_buildBody(%s %ss)', items.length, typeof items);

        var set      = [];
        var finished = 0;

        items.slice(0, 50);

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

            _getRuncom(item, function (runcom) {

                selection.runcom = runcom;

                finished++;

                if (finished === items.length) { // this never true

                    /*XXX*/console.log('_buildBody done', selection.runcom);

                    callback(set, true);
                }
            });

            set[index] = selection;

        });
    }

    function _getRuncom(item, callback) {
        var runcomPattern = new RegExp('^[\\.,dot,_]*' + gq.shell + '$', 'ig');

        var trees_url  = item.trees_url.replace('{/sha}', '/' + item.default_branch);
        var runcomFile = false;
        var i          = 0;

        request({
            url: trees_url,
            json: true,
            headers: {
                'User-Agent': 'comp74-student',
                Authorization: 'token e03aa1982ccd7c291f39a0b0e4db54a0718c940c' // XXX REMOVE XXX
            }
        }, function (error, response, body) {
            if (error) throw new Error(error);
            var len = Object.keys(body).length;

            var files = body.tree || null;
            var numFiles = files.length;
            files.forEach(function (file) { // XXX no safe default if no match

                var fileName = file.path;

                if (fileName.match(runcomPattern)) {
                    /*XXX*/console.log('file %s matches %s', file.path, runcomPattern);
                    runcomFile = fileName;

                }  else {
                    runcomFile = 'NO MATCH';
                }


                if (i >= numFiles - 1) {

                    /*XXX*/console.log('_getRuncom done with %s', runcomFile);

                    callback(runcomFile); // Return matching runcom file
                }
                i++;
            });
        });

    }


module.exports = gq;

