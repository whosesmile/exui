var fs = require('fs');
var path = require('path');
var pkg = require('./package.json');
var gulp = require('gulp');
var less = require('gulp-less');
var rename = require('gulp-rename');
var cssnano = require('gulp-cssnano');
var concat = require('gulp-concat-util');
// gulp-autoprefixer has a bug on sourcemaps, so should use postcss to replace it
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync').create();

var option = {
  base: 'src'
};
var dist = __dirname + '/dist';

var banner = `/*!
* EXUI v<%= pkg.version %> (<%= pkg.homepage %>)
* Copyright <%= new Date().getFullYear() %> whosesmile@gmail.com.
* Licensed under the <%= pkg.license %> license
*/
`;

// 递归遍历目录查找HTML
function traversal(dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  var pending = list.length;

  list.forEach(function (file) {
    file = path.resolve(dir, file);
    var stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(traversal(file));
    }
    else if (path.extname(file) === '.html') {
      results.push(file);
    }
  });
  return results;
}

// 编译EXUI LESS
gulp.task('build:less', function () {
  gulp.src('src/style/exui.less', option)
    .pipe(sourcemaps.init())
    .pipe(less())
    .pipe(postcss([autoprefixer(['iOS >= 7', 'Android >= 4.1'])]))
    .pipe(concat.header(banner, {
      pkg: pkg,
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest(dist))
    .pipe(browserSync.stream())
    .pipe(cssnano({
      safe: true,
    }))
    .pipe(rename({
      suffix: '.min',
    }))
    .pipe(gulp.dest(dist));
});

// 编译范例样式
gulp.task('build:example:less', function () {
  gulp.src('src/example/**/*.less', option)
    .pipe(less())
    .pipe(gulp.dest(dist))
    .pipe(browserSync.stream());
});

// 整合范例模板
gulp.task('build:example:html', function () {
  var templates = [];
  traversal(path.join(__dirname, 'src/example/fragment')).forEach(function (file) {
    var id = path.basename(file, '.html');
    var content = fs.readFileSync(file, 'utf-8').trim();
    templates.push(`<script type="text/exui-templates" id="exui_${id}">${content}</script>`);
  });
  gulp.src('src/example/index.html', option)
    .pipe(concat.footer(templates.join('\n')))
    .pipe(gulp.dest(dist))
    .pipe(browserSync.stream());
});

// 同步范例素材
gulp.task('build:example:assets', function () {
  gulp.src('src/example/**/*.?(ico|png|jpg|gif|js)', option)
    .pipe(gulp.dest(dist))
    .pipe(browserSync.stream());
});

// 范例构建汇总
gulp.task('build:example', ['build:example:assets', 'build:example:less', 'build:example:html']);

// 监听改变
gulp.task('watch', ['build:less', 'build:example'], function () {
  gulp.watch('src/style/**/*', ['build:less']);
  gulp.watch('src/example/**/*.html', ['build:example:html']);
  gulp.watch('src/example/**/*.less', ['build:example:less']);
  gulp.watch('src/example/**/*.?(png|jpg|gif|js)', ['build:example:assets']);
});

// 启动服务
gulp.task('default', ['watch'], function () {
  browserSync.init({
    port: 8080,
    server: {
      baseDir: './dist'
    },
    startPath: '/example',
  });
});