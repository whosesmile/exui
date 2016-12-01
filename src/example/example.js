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
      console.log(JSON.stringify(history.state))
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
      return view.addClass('ex-view-in').on('animationend webkitAnimationEnd', function () {
        view.removeClass('ex-view-in');
      });
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