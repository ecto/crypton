#!/usr/bin/env node
"use strict";

var program = require('commander');
var fs = require('fs');
var connect = require('connect');
var assert = require('assert');

program
    .version('0.0.1')
    .option('-c, --config [file]',
            'Specify a custom configuration file [default config]')
    .option('-p, --port [port]', 'Specify a port number [2013]', 2013)
    .option('-v, --verbose', 'Enable verbose logging')
    .parse(process.argv);

var express = require('express');
var app = process.app = module.exports = express();

if (process.env.NODE_ENV.toLowerCase() === 'test') {
    app.config = require('./lib/config')(__dirname + '/config.test.json');
} else {
    app.config = require('./lib/config')(program.config);
}

app.datastore = require('./lib/storage');
/*jslint camelcase: false*/
app.id_translator = require("id_translator")
    .load_id_translator(app.config.id_translator.key_file);
/*jslint camelcase: true*/

var allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers',
               'x-requested-with,content-type');
    next();
};

var fileContentsSync = function fileContentsSync(path, length, position) {
    if ("undefined" === typeof position) {
        position = 0;
    }
    var descriptor = fs.openSync(path, "r");
    var contents = new Buffer(length);
    contents.fill(0);
    var bytesRead = fs.readSync(descriptor, contents, 0, length, position);
    assert(bytesRead === length);
    fs.closeSync(descriptor);
    return contents;
};

app.use(express.logger({stream: process.stdout}));
app.use(connect.cookieParser());
/*jslint camelcase: false*/
app.use(connect.session({
    secret: fileContentsSync(app.config.cookie_secret_file,
                             app.config.default_key_size).toString('binary'),
    store: connect.MemoryStore,
    key: 'crypton_sid',
    // TODO secure: true when we add SSL
    cookie: { secure: false }
}));
/*jslint camelcase: true*/
app.use(allowCrossDomain);
app.use(express.bodyParser());

// var logFile = fs.createWriteStream('/tmp/crypton_server.log', {flags: 'a'});

require('./routes');

var start = app.start = function start() {
    app.listen(program.port);
};

if (!module.parent) {
    start();
}