/**
 * @file 验证器 
 * @author treelite(c.xinle@gmail.com)
 */

define(function (require) {

    // 验证器集合
    var validator = {};

    // 内置正则验证规则
    var regRules = {
        email: /^[_\w-]+(\.[_\w-]+)*@([\w-])+(\.[\w-]+)*((\.[\w]{2,})|(\.[\w]{2,}\.[\w]{2,}))$/,
        url: /^[^.。，]+(\.[^.，。]+)+$/,
        zipCode: /^\d{6}$/,
        mobilePhone: /^1\d{10}$/
    };

    /**
     * 日期字符串比较
     *
     * @param {string} date1
     * @param {string} date2
     */
    function compareDate(date1, date2) {
        date1 = baidu.date.parse(date1);
        date2 = baidu.date.parse(date2);

        return date1.getTime() - date2.getTime();
    }

    /**
     * 字符串长度验证
     *
     * @param {string} value
     * @param {Object} rule 验证规则
     * @return {boolean} 验证结果
     */
    validator.len = function (value, rule) {
        var res = true;

        value = new String(value);

        if (rule.min !== undefined) {
            res = res && value.length >= rule.min;
        }

        if (rule.max !== undefined) {
            res = res && value.length <= rule.max;
        }

        return res;
    };

    /**
     * 数字范围验证
     *
     * @param {number} value 
     * @param {Object} rule 验证规则
     * @return {boolean} 验证结果
     */
    validator.range = function (value, rule) {
        var res = true;

        value = new Number(value);

        if (rule.min !== undefined) {
            res = res && value >= rule.min;
        }

        if (rule.max !== undefined) {
            res = res && value <= rule.max;
        }

        return res;
    };

    /**
     * 正则验证
     *
     * @param {string} value 
     * @param {Object} rule 验证规则
     * @return {boolean} 验证结果
     */
    validator.regexp = function (value, rule) {
        var reg = regRules[rule.rule] || new RegExp(rule.rule);

        value = new String(value);
        return reg.test(value);
    };

    /**
     * 日期字符串验证
     *
     * @param {string} value
     * @param {Object} rule 验证规则
     * @return {boolean} 验证结果
     */
    validator.date = function (value, rule) {
        var res = true;

        if (rule.min !== undefined) {
            res = res && compareDate(value, rule.min) >= 0;
        }

        if (rule.max !== undefined) {
            res = res && compareDate(value, rule.max) <= 0;
        }

        return res;
    };

    return {
        /**
         * 验证控件
         *
         * @public
         * @param {Object} control ECUI输入控件
         * @param {Array.<Object>} rules 验证规则
         * @return {boolean} 验证结果
         */
        validate: function (control, rules) {
            var value = control.getValue();

            function validate(value, rules) {
                var res = true;
                if (Object.prototype.toString.call(rules) != '[object Array]') {
                    for (var key in rules) {
                        if (rules.hasOwnProperty(key)) {
                            res = res && validate(value[key], rules[key]);
                        }
                    }
                }
                else {
                    for (var i = 0, item; item = rules[i]; i++) {
                        res = validator[item.type](value, item);
                        if (!res) {
                            control.setError(item.msg || '出错啦');
                            break;
                        }
                    }
                }
                return res;
            }

            control.setError();
            return validate(value, rules);
        }
    };
});
