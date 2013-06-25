/**
 * @file: 异步通信，在e-json的基础上封装
 * @author: treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ejson = require('./ejson');

    return {
        get: ejson.get,
        post: ejson.post,
        request: ejson.request
    };
});
