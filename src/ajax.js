/**
 * @file: 异步通信，在e-json的基础上封装
 * @author: treelite(c.xinle@gmail.com) 
 *          coocon(coocon2007@gmai.com)
 *
 */

define(function (require) {
    //TODO: 这个地方 默认用script加载trangram，否则 可以修改为require形式
    var T = T || baidu ;
    var jsonToQuery = T.url.jsonToQuery;

    var ejson = require('./ejson');
    var layer = require('./layer');
    var contains = T.array.contains;
    var lastIndexOf = T.array.lastIndexOf;
    var removeAt = T.array.removeAt;
    var blank = function () {};

    //请求队列
    var requestQueue = (function () {
        var queue = [];
        var norFlag = '__req__';
        return {
            /**
             * 添加请求队列
             * 如果请求的tokenId重复则会被忽略
             * 如果请求队列在添加前为空 则会显示loading浮层
             * @public
             *
             * @param {String} tokenId 
             * @param {Boolean} mask 是mask整个页面
             */
            add: function (tokenId, mask) {
                if (!tokenId || !contains(queue, tokenId)) {
                    mask = mask || false;
                    if (queue.length <= 0) {
                        layer.notify(
                            '<i class="icon-loading"></i><span>加载中...</span>'
                            , mask);
                    }
                    else {
                        //请求队列已经有非mask的请求了，需要单独添加mask
                        if (mask) {
                            layer.setNoticeMask(); 
                        }
                    }

                    queue.push(tokenId || norFlag);
                }
            },

            /**
             * 减少请求队列
             * 如果减少后请求队列为空 则会隐藏loading浮层
             * @public
             *
             * @param {String} tokenId 可省略
             */
            reduce: function (tokenId) {
                var flag = tokenId || norFlag;

                removeAt(queue, lastIndexOf(queue, flag));
                if (queue.length <= 0) {
                    layer.hideNotice();
                }
            },

            /**
            *  获取队列里请求的总个数
            *  @return {Number} 返回队列长度
            */
            getLength: function () {
                return queue.length;    
            }
        };
    
    })();

    // 缓存管理
    var cacheManager = (function () {
        var cache = {};

        return {
            /**
             * 生成请求对应的缓存key
             * 根据URL和参数来唯一标识一个请求
             *
             * @param {String} url
             * @param {String} params 请求参数
             * @return {String}
             */
            generateKey: function (url, params) {
                if (params) {
                    url += (url.indexOf('?') >= 0 ? '&' : '?') + params;
                }

                return encodeURIComponent(url);
            },

            /**
             * 设置缓存
             *
             * @param {String} key
             * @param {Any}    data 请求返回的数据
             * @param {Object} response 请求返回的E-JSON数据
             * @return {Object} 缓存数据
             */
            set: function (key, data, response) {
                cache[key] = {
                    data : data,
                    response : response
                };
                return cache[key];
            },

            /**
             * 获取缓存
             *
             * @param {String} key
             * @return {Object} 缓存数据
             */
            get: function (key) {
                return cache[key];
            }
        };
    })();

    // token管理
    var tokenManager = (function () {
        var tokens = [];

        return {
            /**
            * 生成ajax的token，使得重复url调用最后一次请求的回调
            * @param {String} tokenId  标识id
            * @return {Number} tokenId  该标识的Count值
            */
            generate: function (tokenId) {
                if (!tokens[tokenId]) {
                    tokens[tokenId] = 0;
                }
                return ++tokens[tokenId];
            },
            /**
            * 获取token
            * @param {String} tokenId  标识id
            * @return {Number} tokenId  该标识的Count值
            */
            get: function (tokenId) {
                return tokens[tokenId];
            },
            /**
            * 验证token是否是最新的
            * @param {String} token  标识的Count值
            * @param {String} tokenId  标识id
            * @return {Boolean} tokenId  该标识的Count值
            */
            valiate: function (token, tokenId) {
                return !!token ? token == tokens[tokenId] : true;
            }
        };

    })();

    /**
    * 防止重复提交
    */
    var repeatManager = (function () {
        var queue = [];

        return {
            /**
             * 生成请求对应的缓存key
             * 根据URL和参数来唯一标识一个请求
             *
             * @param {String} url
             * @param {String} params 请求参数
             * @return {String}
             */
            generateKey: function (url, params) {
                if (params) {
                    url += (url.indexOf('?') >= 0 ? '&' : '?') + params;
                }
                return encodeURIComponent(url);
            },

            /**
             * 减少防重复请求队列
             * @public
             *
             * @param {String} key
             */
            reduce: function (key) {
                T.array.remove(queue, key);
            },

            /**
             * 根据URL和参数来唯一标识一个请求
             * 若该请求已存在队列中，则返回false，否则返回true
             *
             * @param {string} url
             * @param {string} params 请求参数
             * @return {boolean}
             */
            validate: function (key) {
                //var key = this.generateKey(url, params);

                if (T.array.contains(queue, key)) {
                    return false;
                } else {
                    queue.push(key);
                    return true;
                }
            }
        };

    })();
     
    var errorHandlers = {};

    /**
     * 默认错误处理
     */
    errorHandlers.def = function (status, obj) {
        var msg = obj.statusInfo || '系统开小差了，请稍后重试...';

        layer.warning(msg);
    };

    /**
    * seesion失效
    */
    errorHandlers['201'] = function (status, obj) {
        var msg = obj.statusInfo.msg || '当前会话失效，请重新登录';

        layer.warning(msg, function () {
            if (window.parent) {
                window.parent.location = obj.statusInfo;
                } else {
                window.location = obj.statusInfo;
            }
        });
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
    
    /**
    * 创建成功的回调
    */
    function creatSuccessHandler(options) {
        var success = options.onsuccess || blank;
        var guid = options.guid;

        var callback = function(data, obj) {
            // 重复点击
            if (options.preventRepeat) {
                repeatManager.reduce(options.repeatKey);
            }
            //如果应用token特性 再判断
            if (options.usedToken) {
                if (!tokenManager.valiate(options.token, options.tokenId)) {
                    requestQueue.reduce(guid);
                    return;
                } 
            }
            
            //添加缓存处理
            if (options.cache) {
                cacheManager.set(options.cacheKey, data, obj);
            }
            
            
            //调用回调函数
            success.call(null, data, obj);

            // 请求已完成，减少请求队列数
            if (options.queue !== false) {
                requestQueue.reduce(guid);
            }
        };
        return  callback;
    }

    /**
    * 创建失败的回调
    */
    function creatFailureHandler(options) {
        var failure = options.onfailure;
        var guid = options.guid;

        //失败回调
        var callback = function (status, obj) {
 
            if (options.preventRepeat) {
                repeatManager.reduce(options.repeatKey);
            }           
            //如果应用token特性 再判断
            if (options.usedToken) {
                if (!tokenManager.valiate(options.token, options.tokenId)) {
                    requestQueue.reduce(guid);
                    return;
                } 
            }
           

            // 请求已完成，减少请求队列数
            if (options.queue !== false) {
                requestQueue.reduce(options.guid);
            }
           
            //有错误处理函数，就调用
            if (failure) {
                var res =  callback.call(null, status, obj);
                // 如果自定义错误处理函数返回false则阻止默认的错误处理
                if (res === false) {
                    return;
                }
            }
            var defHandler = errorHandlers[status] || errorHandlers.def;
            defHandler(status, obj);
        };
        return callback;
    }

   /**
     * 生成GUID
     * @private
     *
     * @refer http://goo.gl/0b0hu
     */
    function createGUID() {
        var str = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
        return str.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
    * 用来增加url的参数 ，判断添加& or ？
    *
    * @param {String} url   被添加参数的url
    * @param {String} params   需要添加的参数
    * @return {String}   添加了参数的新的url
    */
    function addParams4URL(url, params) {
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + params;
    }

    /**
    * ajax请求的方法
    * @param {String} url 请求的url地址
    * @param {Object} options 请求的参数
    * @param {Function} options.onsuccess 成功的回调
    * @param {Function} options.onfailure 失败的回调
    *
    */
    function request(url, options) {

        // 关于cache的处理功能
        var o = null;

        options.cacheKey = cacheManager.generateKey(url, options.data);
        options.repeatKey = repeatManager.generateKey(url, options.data);
        // 为请求添加token,根据url 生成tokenId
        options.tokenId = encodeURIComponent(url);
        options.token = tokenManager.generate(options.tokenId);

        // 唯一标识 用来添加到请求队列
        options.guid = createGUID();

        //防止二次点击 参数和url都相同
        if (options.preventRepeat && !(o = repeatManager.validate(options.repeatKey))) {
            return;
        } 

        if (options.cache && (o = cacheManager.get(options.cacheKey))) {
            options.onsuccess.call(null, o.data, o.response);
            return;
        }

        // 添加请求队列 发起请求
        if (options.queue !== false) {
            requestQueue.add(options.guid, options.mask);
        }
        
        // 添加随机参数防止浏览器缓存
        if (options.method == 'get') {
            url = addParams4URL(url, 'req=' + (new Date()).getTime());
        }
        else {
            if (!options.data) {
                options.data = 'req=' + (new Date()).getTime();
            }
        }
        //创建 成功和失败的回调
        options.onsuccess = creatSuccessHandler(options);
        options.onfailure = creatFailureHandler(options);

        ejson.request(url, options);
    }

    return {
        /**
         * 经典的get方法
         * @param {String} url ajax请求的url
         * @param {Function} onsuccess 成功的回调函数
         * @param {Function} onfailure 失败的回调函数
         */
        get: function (url, onsuccess, onfailure) {
            var options = {
                method: 'get',
                onsuccess: onsuccess,
                onfailure: onfailure
            };

            request(url, options);
        },

        /**
         * 经典的post方法
         * @param {String} url ajax请求的url
         * @param {Object|String} data ajax请求的数据，建议是Object
         * @param {Function} onsuccess 成功的回调函数
         * @param {Function} onfailure 失败的回调函数
         */
        post: function (url, data, onsuccess, onfailure) {
            if (typeof data != 'string') {
                data = jsonToQuery(data, encodeURIComponent);
            }

            var options = {
                method: 'post',
                data: data,
                onsuccess: onsuccess,
                onfailure: onfailure
            };

            request(url, options);
        },

        /**
         * 封装的dao方法 ，前端调用dao方法，可以完成常用的基本操作
         * @param {String} url ajax请求的url 一定是post 没有处理get
         * @param {Object|String} data ajax请求的数据，建议是Object
         * @param {Function} onsuccess 成功的回调函数
         * @param {Function} onfailure 失败的回调函数
         * @param {Object} options 一些可配置的参数
         * @param {Boolean} options.cache 是否应用缓存 默认是false
         * @param {Boolean} options.preventRepeat 是否应用启动防止二次点击 默认是false
         * @param {Boolean} options.mask 是在ajax的时候 启动mask，屏蔽点击 默认是false
         * @param {Boolean} options.queue 是否需要添加到请求队列，出现loading标志默认是true
         * @param {Boolean} options.usedToken 是否应用token机制，只响应相同url的最后一次请求，默认true
         *
         */
        dao: function (url, data, onsuccess, onfailure, options) {
            if (typeof data != 'string') {
                data = jsonToQuery(data, encodeURIComponent);
            }
            var _options = {
                method: 'post',
                data: data,
                onsuccess: onsuccess,
                onfailure: onfailure,
                preventRepeat: false,
                cache: false,
                mask: false,
                queue: true,
                usedToken: true
            };
            _options = baidu.extend(_options, options);
            request(url, _options);
        },

        request: request
    };
});
