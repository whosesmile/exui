// 显隐列表
$(document).on('click', '.ex-group .list:first-child', function () {
  var selected = $(this).closest('.ex-group').toggleClass('active');
  $('.ex-group').not(selected).removeClass('active');
});

// 路由切换
function Router() {
  this.routes = [];
  window.addEventListener('popstate', this.handler.bind(this), false);
  document.addEventListener("DOMContentLoaded", this.handler.bind(this), false);
}

Router.prototype = {

  handler: function () {
    var state = history.state || {};
    // 新增 或 前进
    if (typeof state.index === 'undefined' || state.index > this.routes.length) {
      var name = location.hash.replace(/^#/, '');
      if (name) {
        this.routes.push({
          name: name,
          view: this.buildView(name),
        });
      }
      history.replaceState({
        index: this.routes.length,
      }, name || 'index', location.href);
    }
    // 后退
    else {
      while (this.routes.length > state.index) {
        this.destroyView(this.routes.pop());
      }
    }
  },

  buildView: function (name) {
    var page = $('#exui_' + name)
    if (page.length) {
      var view = $(page.html()).appendTo('body');
      view.addClass('ex-view-in').on('animationend webkitAnimationEnd', function () {
        view.removeClass('ex-view-in');
      });
      return view;
    }
  },

  destroyView: function (route) {
    if (route && route.view) {
      route.view.addClass('ex-view-out').on('animationend webkitAnimationEnd', function () {
        $(this).remove();
      });
    }
  },

};

var router = new Router();

// // // // // // // // // // // // // // // // // // // // // // // // // //

// WidgetManager
// 工具类，浮层切换动画
function WidgetManager() {
  this.wrapper = null;
  this.widgets = [];
}

WidgetManager.prototype = {

  // 私有
  _dismiss: function (e) {
    if ($(e.target).is('.ex-widget-layer')) {
      e.data && e.data.hide();
    }
  },

  // 填充
  fill: function (templ, opts) {
    var self = this;
    if (!this.wrapper) {
      this.wrapper = $('<div class="ex-widget-layer" />').appendTo('body');
      this.wrapper.on('click', '[data-dismiss="true"]', function () {
        self.hide();
      });
    }

    opts = opts || {};

    // 重置背景
    this.wrapper.attr('class', 'ex-widget-layer').toggleClass(opts.clazz, opts.clazz);

    // 点击空白
    this.wrapper.off('click', this._dismiss);
    if (opts.dismiss === true) {
      this.wrapper.on('click', self, this._dismiss);
    }

    // 移除上个组件
    this.popup();
    // 构建当前组件
    var widget = $(templ).addClass('ex-widget-in');
    this.widgets.push(widget);
    // 故意为之 不然不会触发animation
    this.wrapper[0].offsetHeight;
    this.wrapper.append(widget).addClass('ex-widget-in');
    return widget;
  },

  // 显示
  show: function (templ, opts, fn) {
    if (templ) {
      this.fill(templ, opts).on('animationend webkitAnimationEnd', function () {
        fn && fn();
      });
    }
  },

  // 隐藏
  hide: function (fn) {
    var self = this;
    if (!self.wrapper) {
      return false;
    }
    self.wrapper.removeClass('ex-widget-in').addClass('ex-widget-out').on('animationend webkitAnimationEnd transitionend webkitTransitionEnd', function () {
      // 由于样式表不同，可能触发两次事件
      // 一次Animate,一次transistion 要看背景Layer是否做透明渐变 因此这里做个兼容处理
      self.wrapper && self.wrapper.remove();
      self.wrapper = null;
      self.widget = [];
      fn && fn();
    });
  },

  // 交替 (永远只保留一个组件)
  popup: function () {
    var widget = this.widgets.pop();
    if (!widget) {
      return false;
    }
    var self = this;
    widget.removeClass('ex-widget-in').addClass('ex-widget-out').on('animationend webkitAnimationEnd', function () {
      widget.remove();
    });
  },

};

var widgetManager = new WidgetManager();

// // // // // // // // // // // // // // // // // // // // // // // // // //

// fastclick 改写自weui,现在支持事件代理和多事件绑定
(function () {
  // 是否支持touch
  var supported = (function () {
    try {
      document.createEvent("TouchEvent");
      return true;
    }
    catch (e) {
      return false;
    }
  })();

  // 原始方法
  var _onfn = $.fn.on;

  // 截取arguments
  var slice = function (o, i, j) {
    return Array.prototype.slice.call(o, i, j || o.length);
  };

  // 代理改写
  $.fn.on = function () {
    var args = arguments;
    var callback = args[args.length - 1];

    // 包含CLICK && 支持TOUCH && 注册了CALLBACK
    if (/\bclick\b/i.test(args[0]) && supported && typeof callback === 'function') {
      var startY = 0;

      // 插入除回调外的初始参数
      var insertArgs = function (ev, fn) {
        return [ev].concat(slice(args, 1, args.length - 1)).concat(fn);
      };

      // 记录触发点
      _onfn.apply(this, insertArgs('touchstart', function __$delegate(e) {
        startY = e.changedTouches[0].pageY;
      }));

      // 判断结尾点
      _onfn.apply(this, insertArgs('touchend', function __$delegate(e) {
        var endY = touchY = e.changedTouches[0].pageY;
        // 如果移动不触发点击
        if (Math.abs(endY - startY) > 10) {
          return;
        }
        callback.apply(this, [e].concat(slice(args, 1)));
        // 300ms穿透问题
        e.preventDefault();
      }));

      // 预防多事件绑定
      var events = args[0].replace(/\bclick\b/gi, '').trim();
      if (events) {
        _onfn.apply(this, [events].concat(slice(args, 1)));
      }
    }
    // 不包含CLICK
    else {
      _onfn.apply(this, args);
    }

    return this;
  };

  /** 注意: off click 偷懒处理 会误伤touchstart和touchend **/
  var _offfn = $.fn.off;
  $.fn.off = function () {
    var args = arguments;

    // 包含CLICK && 支持TOUCH && 注册了CALLBACK
    if (/\bclick\b/i.test(args[0]) && supported) {
      _offfn.apply(this, ['touchstart'].concat(slice(args, 1)));
      _offfn.apply(this, ['touchend'].concat(slice(args, 1)));

      // 预防多事件解绑 貌似zepto不支持这个 以防万一
      var events = args[0].replace(/\bclick\b/gi, '').trim();
      if (events) {
        _offfn.apply(this, [events].concat(slice(args, 1)));
      }
    }
    else {
      _offfn.apply(this, args);
    }

    return this;
  };
})();
