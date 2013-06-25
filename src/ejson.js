/*
 * e-json
 * Copyright 2010 Baidu Inc. All rights reserved.
 * 
 * @file 提供E-JSON标准格式的请求与解析功能
 * @auth erik
 */

/**
 * E-JSON标准格式的请求与解析功能
 */
define(function () {
    /**
     * 发送一个数据格式为E-JSON标准的请求
     *
     * @inner
     */
    function request(url, options) {
        var onsuccess = options.onsuccess;
        var onfailure = options.onfailure;
        var isAbort = options.isAbort;
        
        // options.headers = {};
        // options.headers['Content-Type'] = "application/x-www-form-urlencoded; charset=UTF-8;";

        // 包装baidu.ajax.request的success回调
        options.onsuccess = function (xhr) {
        	if(!isAbort || (isAbort && !isAbort(xhr)) ) {
            	process(xhr.responseText, onsuccess, onfailure);
            }
            options = null;
        };

        // 状态码异常时，触发e-json的proccess，status为请求返回的状态码
        options.onfailure = function (xhr) {
        	if(!isAbort || (isAbort && !isAbort(xhr)) ) {
	            process({
	                    status: (xhr.status || 99999), // 宿爽修改，当ajax failure强制走onfailure（fail时xhr.stauts可能因未知原因为0）
	                    statusInfo: xhr.statusText,
	                    data: xhr.responseText
	                },
	                onsuccess,
	                onfailure);
            }
            options = null;
        };

        return baidu.ajax.request(url, options);
    }

    /**
     * 解析处理E-JSON标准的数据
     *
     * @inner
     */ 
    function process(source, onsuccess, onfailure) {
        onfailure = onfailure || new Function();
        onsuccess = onsuccess || new Function();

        var obj;
        try {
            obj = typeof source == 'string' ? baidu.json.parse(source) : source;
        }
        catch (e) {}
        // 不存在值或不为Object时，认为是failure状态，状态码为普通异常
        if (!obj || typeof obj != 'object') {
            onfailure(1, obj);
            return;
        }

        // 请求状态正常
        if (!obj.status) {
            onsuccess(obj.data, obj);
        } else {
            onfailure(obj.status, obj);
        }
    }
 
    return {        
        /**
         * 发送一个数据格式为E-JSON标准的请求
         * 
         * @public
         * @param {string} url 发送请求的url
         * @param {Object} options 发送请求的可选参数
         */
        request: request,
        
        /**
         * 通过get的方式请求E-JSON标准的数据
         * 
         * @public
         * @param {string}   url 发送请求的url
         * @param {Function} onsuccess 状态正常的处理函数，(data字段值，整体数据)
         * @param {Function} onfailure 状态异常的处理函数，(异常状态码，整体数据)
         * @param {Function} isAbort 是否被终止的判断函数
         */
        get: function (url, onsuccess, onfailure, isAbort, timeout, ontimeout) {
            var opt =  {
                    method      : 'get',
                    onsuccess   : onsuccess, 
                    onfailure   : onfailure,
                    isAbort     : isAbort
            };
            if (timeout) {
            	opt['timeout'] = timeout;
            	opt['ontimeout'] = ontimeout;
            };
            request(url, opt);
        },
        
        /**
         * 通过post的方式请求E-JSON标准的数据
         *
         * @public
         * @param {string} url         发送请求的url
         * @param {string} postData    post发送的数据
         * @param {Function} onsuccess 状态正常的处理函数，(data字段值，整体数据)
         * @param {Function} onfailure 状态异常的处理函数，(异常状态码，整体数据)
         * @param {Function} isAbort 是否被终止的判断函数
         */
        post: function (url, postData, onsuccess, onfailure, isAbort, timeout, ontimeout) {
            var opt =  {
                    method      : 'post', 
                    data        : postData, 
                    onsuccess   : onsuccess, 
                    onfailure   : onfailure,
                    isAbort     : isAbort
            };
            if (timeout) {
            	opt['timeout'] = timeout;
            	opt['ontimeout'] = ontimeout;
            };
            return request(url, opt);
        },

        /**
         * 解析处理E-JSON标准的数据
         *
         * @public
         * @param {string|Object}   source    数据对象或字符串形式
         * @param {Function}        onsuccess 状态正常的处理函数，(data字段值，整体数据)
         * @param {Function}        onfailure 状态异常的处理函数，(异常状态码，整体数据)
         */
        process: process
    };
});
