/**
 * @file: 验证器 
 * @author: treelite(c.xinle@gmail.com)
 */

define(function () {

    var validator = {};

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
     */
    validator.regexp = function (value, rule) {
        var reg = regRules[rule.rule] || new RegExp(rule.rule);

        value = new String(value);
        return reg.test(value);
    };

    /**
     * 日期字符串验证
     */
    validator.date = function (value, rule) {
        var res = true;

        if (Object.prototype.toString.call(value) == '[object String]') {
            value = {begin: value};
        }

        if (rule.min !== undefined) {
            if (value.begin) {
                res = res && compareDate(value.begin, rule.min) >= 0;
            }
            else {
                res = false;
            }
        }

        if (rule.max !== undefined) {
            if (value.end) {
                res = res && compareDate(value.end, rule.main) <= 0;
            }
            else {
                res = false;
            }
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
            var res = true;

            control.setError();
            for (var i = 0, item; item = rules[i]; i++) {
                res = validator[item.type](value, item);
                if (!res) {
                    control.setError(item.msg || '出错啦');
                    break;
                }
            }

            return res;
        }
    };
});
