/**
 * @file: 异步通信，在e-json的基础上封装
 * @author: treelite(c.xinle@gmail.com)
 */

/**
 * TODO: 添加请求队列管理
 */

define(function (require) {
    var jsonToQuery = baidu.url.jsonToQuery;

    var ejson = require('./ejson');
    var layer = require('./layer');

    var errorHandlers = {};

    /**
     * 默认错误处理
     */
    errorHandlers.def = function (status, obj) {
        var msg = obj.statusInfo || '系统开小差了，请稍后重试...';

        layer.warning(msg);
    };

    /**
     * 无权操作
     */
    errorHandlers['300'] = function (status, obj) {
        var msg = obj.statusInfo || '无权进行此操作，请联系管理员';

        layer.warning(msg);
    };

    /**
     * 未登录
     */
    errorHandlers['301'] = function (status, obj) {
        var msg = obj.statusInfo.msg || '未登录，请稍后登录';

        layer.warning(msg, false);

        if (obj.statusInfo.url) {
            setTimeout(function () {
                location.href = obj.statusInfo.url;
            }, 3000);
        }
    };

    function creatSuccessHandler(callback) {
        return callback;
    }

    function creatFailureHandler(callback) {
        return function (status, obj) {
            var res;

            if (callback) {
                res = callback.call(null, status, obj);
            }

            if (res === false) {
                return;
            }

            var defHandler = errorHandlers[status] || errorHandlers.def;
            defHandler(status, obj);
        };
    }

    function addParams4URL(url, params) {
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + params;
    }

    function request(url, options) {
        // 添加随机参数防止浏览器缓存
        if (options.method == 'get') {
            url = addParams4URL(url, 'req=' + (new Date()).getTime());
        }
        else {
            if (!options.data) {
                options.data = 'req=' + (new Date()).getTime();
            }
        }

        options.onsuccess = creatSuccessHandler(options.onsuccess);
        options.onfailure = creatFailureHandler(options.onfailure);

        ejson.request(url, options);
    }

    return {
        get: function (url, onsuccess, onfailure) {
            var options = {
                    method: 'get',
                    onsuccess: onsuccess,
                    onfailure: onfailure
                };

            request(url, options);
        },

        post: function (url, data, onsuccess, onfailure) {
            if (typeof data != 'string') {
                data = jsonToQuery(data);
            }

            var options = {
                    method: 'post',
                    data: data,
                    onsuccess: onsuccess,
                    onfailure: onfailure
                };

            request(url, options);
        },

        request: request
    };
});
