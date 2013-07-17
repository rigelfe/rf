/**
 * @file: 浮层操作模块 
 * @author: treelite(c.xinle@gmail.com)
 */

define(function () {

    //notice 的各种需求变量、函数
    var dom = baidu.dom;
    var page = baidu.page;
    var eNotice = null;
    var bNoticeMask = false;
    var noticeTimer = null;

    function clearNoticeTimer() {
        if (noticeTimer) {
            clearTimeout(noticeTimer);
            noticeTimer = null;
        }
    }

  

    var main = {
   
        /**
         * 显示通知浮层
         * 通知浮层位于可视窗口的顶部 用于显示操作结果的提示信息
         * @public
         *
         * @param {string} text 提示文本
         * @param {boolean} mask 是否遮罩整个页面可视区域 防止用户操作
         * @param {number} timeout 自动消失的时间间隔 如果不设置则需要通过调用hideNotice来关闭浮层
         */
        notify: function (text, options) {
            var x = page.getScrollLeft() + page.getViewWidth() / 2;
            var y = page.getScrollTop() + 5;

            if(!eNotice) {
                eNotice = dom.create('div', {
                    className : 'ui-rf-notice',
                    style : 'display:none;'
                });
                document.body.appendChild(eNotice);
            }

            clearNoticeTimer();

            if(eNotice.style.display === '') {
                return false;
            }

            eNotice.innerHTML = text;
            dom.show(eNotice);
            dom.setPosition(eNotice, {
                left : x - eNotice.offsetWidth / 2,
                top : y
            });

            if(options.mask) {
                ecui.mask(0);
                bNoticeMask = true;
            }

            if (options.timeout) {
                noticeTimer = setTimeout(function () {
                    main.hideNotice();
                }, timeout);
            }
            return true;
        },
        /**
         * 关闭通知浮层
         * @public
         */
        hideNotice: function() {
            clearNoticeTimer();
            dom.hide(eNotice);
            if(bNoticeMask) {
                bNoticeMask = false;
                ecui.mask();
            }
        },

        /**
         * 跟tip相关的mask层
         */
        setNoticeMask: function () {
            ecui.mask(0);
            bNoticeMask = true;
        },

        /**
         * 清除tip的mask层
         */
        hideNoticeMask: function () {
            ecui.mask();
            bNoticeMask = false;
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
         * @param {Function} ok 确定按钮的处理函数，如果此删除为false则不显示确定按钮
         */
        warning: function(text, ok) {
            var html = ['<div class="ui-messagebox-warning-icon"></div>'];
            ok = ok === false ? false : (ok || function () {});
            var buttons = ok !== false
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
