/**
 * @file: main模块 
 * @author: treelite(c.xinle@gmail.com)
 */

define(function (require) {
    var ajax = require('./ajax');
    var form = require('./form');
    var layer = require('./layer');
    return {
        ajax: ajax,
        form: form,
        layer: layer,

        //暴露layer里常用的几个函数
        
        /**
         * 显示提示浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {string} text 提示信息
         * @param {Function}  ok 确定按钮的处理函数
         */
        alert: layer.alert,

        /**
         * 警告提示浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {string} text 警告信息
         * @param {Function} ok 确定按钮的处理函数，如果此删除为false则不显示确定按钮
         */
        warning: layer.warning,

        /**
         * 显示确认浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {string} text 提示信息
         * @param {Function}  ok 确定按钮的处理函数
         * @param {Function}  cancel 取消按钮的处理函数
         */
        confirm: layer.confirm,
        version: '${version}'
    };
});
