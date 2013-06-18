/**
 * @file: 浮层操作模块 
 * @author: treelite(c.xinle@gmail.com)
 */

define(function () {

    var dom = baidu.dom;
    var page = baidu.page;
    var eTip = null;
    var bTipMask = false;
    var tipTimer = null;

    function clearTipTimer() {
        if (tipTimer) {
            clearTimeout(tipTimer);
            tipTimer = null;
        }
    }

    var main = {

        /**
         * 显示tip浮层
         * tip浮层位于可视窗口的顶部 用于显示操作结果的提示信息
         * @public
         *
         * @param {string} text 提示文本
         * @param {boolean} mask 是否遮罩整个页面可视区域 防止用户操作
         * @param {number} timeout 自动消失的时间间隔 如果不设置则需要通过调用hideTip来关闭浮层
         */
        tip: function (text, mask, timeout) {
            var x = page.getScrollLeft() + page.getViewWidth() / 2;
            var y = page.getScrollTop() + 5;

            if(!eTip) {
                eTip = dom.create('div', {
                    className : 'rigel-layer-tip loadding-icon',
                    style : 'display:none;'
                });
                document.body.appendChild(eTip);
            }

            clearTipTimer();

            if(eTip.style.display === '') {
                return false;
            }

            eTip.innerHTML = text;
            dom.show(eTip);
            dom.setPosition(eTip, {
                left : x - eTip.offsetWidth / 2,
                top : y
            });
            if(mask) {
                ecui.mask(0);
                bTipMask = true;
            }

            if (timeout) {
                tipTimer = setTimeout(function () {
                    main.hideTip();
                }, timeout);
            }
            return true;
        },
        /**
         * 关闭tip浮层
         * @public
         */
        hideTip: function() {
            clearTipTimer();
            dom.hide(eTip);
            if(bTipMask) {
                bTipMask = false;
                ecui.mask();
            }
        },
        /**
         * 显示提示浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {string} text 提示信息
         * @param {Function}  ok 确定按钮的处理函数
         */
        alert: function(text, ok) {
            ecui.alert(text, ok);
        },
        
        /**
         * 显示确认浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {string} text 提示信息
         * @param {Function}  ok 确定按钮的处理函数
         * @param {Function}  cancel 取消按钮的处理函数
         */
        confirm: function(text, ok, cancel) {
            ecui.confirm(text, ok, cancel);
        },

        /**
         * 警告提示浮层
         * 以模式窗口形式居中显示浮层
         * @public
         *
         * @param {string} text 警告信息
         * @param {Function} ok 确定按钮的处理函数，如果忽略此参数不会显示确定按钮
         */
        warning: function(text, ok) {
            var html = ['<div class="ui-messagebox-warning-icon"></div>'];
            var buttons = ok 
                ? [{text: '确定', className: 'ui-button-g', action: ok}] 
                : [];

            html.push(
                '<div class="ui-messagebox-warning-content">' 
                + '<div class="ui-messagebox-warning-text">' 
                + text 
                + '</div></div>'
            );
            ecui.$messagebox(html.join(''), '警告', buttons, 0.3);
        }
    };

    return main;
});
