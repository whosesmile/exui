// 显隐列表
$(document).on('click', '.ex-group .list:first-child', function() {
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

  handler: function() {
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

  buildView: function(name) {
    var page = $('#exui_' + name)
    if (page.length) {
      var view = $(page.html()).appendTo('body');
      view.addClass('ex-view-enter');
      view[0].offsetHeight;
      view.addClass('ex-view-enter-active').on('transitionend webkitTransitionEnd', function() {
        view.removeClass('ex-view-enter ex-view-enter-active');
      });
      return view;
    }
  },

  destroyView: function(route) {
    if (route && route.view) {
      route.view.addClass('ex-view-exit');
      route.view[0].offsetHeight;
      route.view.addClass('ex-view-exit-active').on('transitionend webkitTransitionEnd', function() {
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
  this.widgets = [];
}

WidgetManager.prototype = {

  // 填充
  fill: function(templ, opts) {
    // 移除上个组件
    this.popup();

    opts = opts || {};
    var widget = null;
    // 模态
    if (opts.modal !== false) {
      widget = $('<div class="ex-widget-layer" />').addClass(opts.clazz || '').append(templ);
    }
    // 非模态
    else {
      widget = $(templ);
    }

    // 点击关闭
    widget.on('click', function(e) {
      if (e.target.dataset.dismiss === 'true' || (opts.dismiss && $(e.target).is('.ex-widget-layer'))) {
        this.hide();
      }
    }.bind(this));

    // 构建当前组件
    this.widgets.push(widget);
    widget.addClass('ex-widget-enter').appendTo('body');
    // 故意为之 不然不会触发animation
    widget[0].offsetHeight;
    widget.addClass('ex-widget-enter-active');
    return widget;
  },

  // 显示
  show: function(templ, opts, fn) {
    var widget = this.fill(templ, opts);
    widget.on('transitionend webkitTransitionEnd', function() {
      widget.removeClass('ex-widget-enter ex-widget-enter-active');
      fn && fn();
    });
  },

  // 隐藏
  hide: function(fn) {
    this.popup(fn);
  },

  // 交替 (永远只保留一个组件)
  popup: function(fn) {
    var widget = this.widgets.pop();
    if (!widget) {
      return false;
    }
    widget.addClass('ex-widget-exit');
    widget[0].offsetHeight;
    widget.addClass('ex-widget-exit-active').on('transitionend webkitTransitionEnd', function() {
      widget.remove();
      fn && fn();
    });
  },

};

var widgetManager = new WidgetManager();

// // // // // // // // // // // // // // // // // // // // // // // // // //

// fastclick 改写自weui,现在支持事件代理和多事件绑定
// (function() {
//   // 是否支持touch
//   var supported = (function() {
//     try {
//       document.createEvent("TouchEvent");
//       return true;
//     } catch (e) {
//       return false;
//     }
//   })();

//   // 原始方法
//   var _onfn = $.fn.on;

//   // 截取arguments
//   var slice = function(o, i, j) {
//     return Array.prototype.slice.call(o, i, j || o.length);
//   };

//   // 代理改写
//   $.fn.on = function() {
//     var args = arguments;
//     var callback = args[args.length - 1];

//     // 包含CLICK && 支持TOUCH && 注册了CALLBACK
//     if (/\bclick\b/i.test(args[0]) && supported && typeof callback === 'function') {
//       var startY = 0;

//       // 插入除回调外的初始参数
//       var insertArgs = function(ev, fn) {
//         return [ev].concat(slice(args, 1, args.length - 1)).concat(fn);
//       };

//       // 记录触发点
//       _onfn.apply(this, insertArgs('touchstart', function __$delegate(e) {
//         startY = e.changedTouches[0].pageY;
//       }));

//       // 判断结尾点
//       _onfn.apply(this, insertArgs('touchend', function __$delegate(e) {
//         var endY = touchY = e.changedTouches[0].pageY;
//         // 如果移动不触发点击
//         if (Math.abs(endY - startY) > 10) {
//           return;
//         }
//         callback.apply(this, [e].concat(slice(args, 1)));
//         // 300ms穿透问题
//         e.preventDefault();
//       }));

//       // 预防多事件绑定
//       var events = args[0].replace(/\bclick\b/gi, '').trim();
//       if (events) {
//         _onfn.apply(this, [events].concat(slice(args, 1)));
//       }
//     }
//     // 不包含CLICK
//     else {
//       _onfn.apply(this, args);
//     }

//     return this;
//   };

//   /** 注意: off click 偷懒处理 会误伤touchstart和touchend **/
//   var _offfn = $.fn.off;
//   $.fn.off = function() {
//     var args = arguments;

//     // 包含CLICK && 支持TOUCH && 注册了CALLBACK
//     if (/\bclick\b/i.test(args[0]) && supported) {
//       _offfn.apply(this, ['touchstart'].concat(slice(args, 1)));
//       _offfn.apply(this, ['touchend'].concat(slice(args, 1)));

//       // 预防多事件解绑 貌似zepto不支持这个 以防万一
//       var events = args[0].replace(/\bclick\b/gi, '').trim();
//       if (events) {
//         _offfn.apply(this, [events].concat(slice(args, 1)));
//       }
//     } else {
//       _offfn.apply(this, args);
//     }

//     return this;
//   };
// })();
