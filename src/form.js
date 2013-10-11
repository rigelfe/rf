/**
 * Form 表单管理
 *
 * @file:   表单控件，提供输入校验等功能，
 *          子控件现在只支持ecui控件，
 *          form主元素内部的，主元素有name属性的ecui InputControl控件，会被引用为子控件，
 *          管理其提交，验证，出错提示等行为
 * @author: sushuang(sushuang@baidu.com)
 */

define(function (require) {

    var isString = baidu.lang.isString;
    var clone = baidu.object.clone;
    var extend = baidu.object.extend;
    var stringify = baidu.json.stringify;
    var InputControl = ecui.ui.InputControl;

    var ajax = require('./ajax');
    var layer = require('./layer');
    var ValidateMgr = require('./validate');

    /**
     * 表单控件类
     *
     * @class 
     */
    var Form = constructor;
    var FormProto = Form.prototype;

    /**
     * 后台校验失败的status
     *
     * @const
     */
    var STATUS_VALIDATE_FAIL = 200;

    /**
     * 整理规则
     *
     * @param {Object} rules 验证规则
     * @param {object} controls 控件集合
     */
    function collectRules(rules, controls) {
        var res = {};

        function add(name, rules) {
            var obj = res;
            name = name.split('.');
            for (var i = 0, len = name.length - 1; i < len; i++) {
                if (!obj[name[i]]) {
                    obj[name[i]] = {};
                }
                obj = obj[name[i]];
            }
            obj[name[name.length - 1]] = rules;
        }

        for (var name in rules) {
            if (rules.hasOwnProperty(name)) {
                if (!controls[name] && name.indexOf('.') >= 0) {
                    var item = rules[name];
                    delete rules[name];
                    add(name, item);
                }
            }
        }

        return extend(rules, res);
    }

    /**
     * 表单控件构造函数
     *
     * @constructor
     * @param {HTMLElement} el 表单控件主元素
     * @param {Object} options 初始化参数
     * @param {string=} options.url 提交用的url
     * @param {string=} options.ruleURL 获取validateRule的url
     * @param {string=} options.fetchRulesFailMsg 获取校验规则失败提示信息
     */
    function constructor(el, options) {
        /**
         * Form的主元素
         * 
         * @private 
         */
        this._eMain = el;
        /**
         * 引用的子控件集合
         * 结构为：name ==> InputControl
         *
         * @private 
         */
        this._oCtrlMap = {};
        /**
         * 设置
         *
         * @private
         */
        this._oOptions = options = clone(options || {});

        // 默认值
        if (!options.fetchRulesFailMsg) {
            options.fetchRulesFailMsg = '获取校验规则失败';
        }

        this.$linkControl();

        if (options.ruleURL) {
            this.$fetchRemoteRules(options.ruleURL);
        }
    }

    /**
     * 处理请求参数，合并map
     * 
     * @param {Object} reqParam
     * @return {Object}
     */
    function processReqParam(reqParam) {
        var data = {};
        for (var key in reqParam) {
            if (reqParam.hasOwnProperty(key)) {
                var names = key.split('.');
                var res = data;
                for (var i = 1, len = names.length; i < len; i++) {
                    if (!res[names[0]]) {
                        res[names[0]] = {};
                    }
                    res = res[names[0]];
                    names.splice(0, 1);
                }
                res[names[0]] = reqParam[key];
            }
        }

        return data;
    }

    /**
     * 表单控件初始化
     * 
     * @public
     */
    /*
    FormProto.init = function () {
        // 建立对子控件的引用
        this.$linkControl();
    };
    */

    /**
     * 表单控件析构
     * 
     * @override
     * @public
     * @param {string|Array.<Object>} rules 验证规则URL地址或者具体的验证规则
     */
    FormProto.dispose = function () {
        this._oCtrlMap = {};
        this._eMain = null;
        Form.superClass.dispose.call(this);
    };

    /**
     * 建立与子控件的引用
     * 
     * @protected
     */
    FormProto.$linkControl = function () {
        var ctrlMap = this._oCtrlMap;
        var els = this._eMain.getElementsByTagName('*');

        for (var i = 0, el, name, ctrl; el = els[i]; i ++) {
            if (el.getControl
                && (ctrl = el.getControl())
                // 须是InputControl
                && ctrl instanceof InputControl
                // 靠name来定位（同时排除子控件）。
                // 这里有个潜在要求：所有InputControl，在二次开发做子控件用时，
                // 不允许使用name作为options参数或者属性名
                && (name = ctrl.getName())
            ) {
                ctrlMap[name] = ctrl;
            }
        }
    };    

    /**
     * 设置表单的验证规则
     * 
     * @public
     * @param {(string|Object)=} ruleMap 验证规则URL地址或者具体的验证规则
     *      如果缺省此参数，则取初始化时设置的ruleURL取验证规则
     *      如果为具体的验证规则，则结构为：name ==> Array.<Object>
     */
    FormProto.setValidateRules = function (ruleMap) {
        if (!ruleMap) {
            // 使用预先定义的ruleURL从后端获取
            ruleMap = this._oOptions.ruleURL;
        }

        isString(ruleMap)
            ? this.$fetchRemoteRules(ruleMap)
            : (this._oRuleMap = clone(ruleMap));
    };

    /**
     * 远程获取表单的验证规则
     * 
     * @protected
     * @param {string} url 验证规则URL地址
     */
    FormProto.$fetchRemoteRules = function (url) {
        var me = this;
        ajax.get(
            url, 
            function (data, ejsonObj) {
                me._oRuleMap = data;
            },
            function (status, ejsonObj) {
                layer.alert(me._oOptions.fetchRulesFailMsg);
                me._oRuleMap = {};
                return false;
            },
            //不使用token，否则两个相同的url会执行最后一次回调
            { usedToken: false }
        );
    };

    /**
     * 验证表单
     * 根据验证规则调用validateMgr进行表单验证，返回验证结果
     *
     * @public
     * @return {boolean} 验证结果
     */
    FormProto.validate = function () {
        var ctrlMap = this._oCtrlMap;
        var ruleMap = extend({}, this._oRuleMap || {});
        var valid = true;

        ruleMap = collectRules(ruleMap, ctrlMap);

        for (var name in ctrlMap) {
            var rules = ruleMap[name];
            if (rules && !ValidateMgr.validate(ctrlMap[name], rules)) {
                valid = false;
            }
        }

        return valid;
    };

    /**
     * 提交数据
     * 提交前会进行调用validate进行前端表单验证
     * 提交后如果server验证失败则会根据验证错误信息调用相关输入控件的setError方法现实错误提示
     * 还需要进行防二次提交处理
     *
     * @public
     * @param {Object} options 参数
     * @param {string=} options.url 可以覆盖已经配置的url
     * @param {Object=} options.extraData 额外的提交参数
     * @param {Function} options.onsubmit 提交前的回调函数，
     *      参数为：
     *          {Object} reqParam reqParam格式为：name ==> value
     *      返回值为：
     *          {boolean} 如果返回为false，则不提交，否则正常提交
     * @param {Function} options.onsuccess 状态正常的处理函数，
     *      参数为：
     *          {(Object|string)} data字段值
     *          {Object} ejsonObj 整体数据
     * @param {Function} options.onfailure 状态异常的处理函数，
     *      参数为：
     *          {number} status 异常状态码
     *          {Object} ejsonObj 整体数据
     * @param {Object} options.options ajax的请求参数配置，
     *      参数为：
     *          @param {Boolean} options.cache 是否应用缓存 默认是false
     *          @param {Boolean} options.preventRepeat 是否应用启动防止二次点击 默认是false
     *          @param {Boolean} options.mask 是在ajax的时候 启动mask，屏蔽点击 默认是false
     *          @param {Boolean} options.queue 是否需要添加到请求队列，出现loading标志默认是true
     *          @param {Boolean} options.usedToken 是否应用token机制，只响应相同url的最后一次请求，默认true
     * 
     */
    FormProto.submit = function (options) {
        options = options || {};
        var ajaxOptions = options.options || {};
        if (!this.validate()) {
            return;
        }

        var me = this;
        var ctrlMap = this._oCtrlMap;

        // 构造请求参数
        var reqParam = {};
        for (var name in ctrlMap) {
            reqParam[name] = ctrlMap[name].getValue();
        }

        // 额外参数
        extend(reqParam, options.extraData || {});

        // 提交前的回调
        if (options.onsubmit && options.onsubmit(reqParam) === false) {
            return;
        }

        ajax.post(
            options.url || this._oOptions.url,
            'reqParam=' + encodeURIComponent(stringify(processReqParam(reqParam))),
            function (data, ejsonObj) { // onsuccess
                options.onsuccess && options.onsuccess(data, ejsonObj);
            },
            function (status, ejsonObj) { // onfailure
                var res = true;

                // 提示后台验证失败
                if (status == STATUS_VALIDATE_FAIL) {
                    var statusInfo = ejsonObj.statusInfo || {};

                    // 每个控件的错误信息
                    for (var name in statusInfo.error) {
                        me.setError(statusInfo.error[name], name);
                    }

                    // 总体的弹窗错误信息
                    if (statusInfo.msg) {
                        layer.warning(statusInfo.msg);
                    }
                    res = false;
                }
                if (options.onfailure) {
                    res = options.onfailure(status, ejsonObj) && res;
                }

                return res;
            },
            ajaxOptions
        );
    };

    /**
     * 回填数据
     *
     * @public
     * @param {Object} datasource 数据，结构为：name ==> data
     */
    FormProto.setData = function (datasource) {
        for (var name in datasource) {
            var ctrl = this._oCtrlMap[name];
            ctrl && ctrl.setData && ctrl.setData(datasource[name]);
        }
    };

    /**
     * 回填数据
     *
     * @public
     * @return {Object} 数据，结构为：name ==> value
     */
    FormProto.getValue = function () {
        var ret = {};

        for (var name in this._oCtrlMap) {
            var ctrl = this._oCtrlMap[name];
            if (ctrl.getValue) {
                ret[name] = ctrl.getValue();
            }
        }

        return ret;
    };

    /**
     * 为子控件设置error信息
     *
     * @public
     * @param {string} msg 
     * @param {string=} name 如果为空，则对所有子控件设置
     */
    FormProto.setError = function (msg, name) {
        var ctrlMap = this._oCtrlMap;
        var ctrlArr = [];
        var ctrl;

        if (name) {
            (ctrl = ctrlMap[name]) && ctrlArr.push(ctrl);
        }
        else {
            for (name in ctrlMap) {
                ctrlArr.push(ctrlMap[name]);
            }
        }

        for (var i = 0; ctrl = ctrlArr[i]; i ++) {
            ctrl.setError(msg);
        }
    };

    return Form;
});
