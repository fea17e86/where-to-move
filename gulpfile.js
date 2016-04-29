/*
 * based on the tutorial linked under:
 *
 * since the new cedavis react/flux/redux/babel/mocha/etc/etc core
 * is way too overheaded to restart from scratch (as its supposed in this project)
 * only built upon babel (6)/react
 */

const gulp = require('gulp');
const less = require('gulp-less');
const browserSync = require('browser-sync');
const reload = browserSync.reload;
const concat = require('gulp-concat');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const sync = require('gulp-sync')(gulp).sync;
const del = require('del');
const watchify = require('watchify');
const sourcemaps = require('gulp-sourcemaps');
const gulpif = require('gulp-if');
const notify = require('gulp-notify');
const merge = require('merge-stream');
const eslint = require('gulp-eslint');
const cache = require('gulp-cache');

const bundler = {
  hotReloading: false,
  w: null,
  init: function init() {
    this.w = watchify(browserify({
      extensions: ['.js', '.jsx', '.json'],
      entries: ['./src/app.jsx'],
      debug: true, // enable inline sourcemaps
      cache: {},
      packageCache: {},
      // TODO #115705 Hot Reloading of React Components can be enabled via build.cfg.json
      // Options for babel(ify) are specified in .babelrc
    }).transform('babelify').transform('envify'));
  },
  bundle: function bundle() {
    return this.w && this.w.bundle()
        .on('error', notify.onError())
      .pipe(source('app.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./dist'))
      .pipe(gulpif(!this.hotReloading, reload({ stream: true })));
  },
  watch: function watch() {
    if (this.w) {
      this.w.on('update', this.bundle.bind(this));
    }
  },
  stop: function stop() {
    if (this.w) {
      this.w.close();
    }
  },
};

gulp.task('scripts:watch', function scriptsWatch() {
  bundler.init();
  return bundler.bundle();
});

gulp.task('scripts', ['scripts:watch'], bundler.stop.bind(bundler));

gulp.task('lint', function lint() {
  return gulp.src(['./src/**/*.*(jsx|js)', './gulpfile.js'])
    .pipe(eslint())
    .pipe(eslint.format());
});

// LESS compiler
gulp.task('styles', function styles() {
  const processedLess = gulp.src('src/styles/*.less').pipe(less());
  const srcCss = gulp.src('src/styles/*.css');
  return merge(processedLess, srcCss)
    .pipe(concat('main.css'))
    .pipe(gulp.dest('dist'))
    .pipe(reload({ stream: true }));
});

// picture-pipe!
gulp.task('images', function images() {
  return gulp.src('./src/images/*.*(png|jpg|gif|svg)')
    .pipe(gulp.dest('./dist/images/'))
    .pipe(reload({ stream: true }));
});

gulp.task('html', function html() {
  return gulp.src('./src/**/*.html')
    .pipe(gulp.dest(('./dist')))
    .pipe(reload({ stream: true }));
});

gulp.task('serve', function serve() {
  browserSync({
    server: {
      baseDir: './dist/',
      port: 3000
    },
  });
});

gulp.task('clean', function clean() {
  del('./dist');
});

gulp.task('clear-cache', function clearCache() {
  cache.clearAll();
});

gulp.task('set-production', function setProduction() {
  process.env.NODE_ENV = 'production';
});

gulp.task('bundle:watch', sync([['images'], ['styles', 'scripts:watch'], 'html']));
gulp.task('clean-bundle:watch', sync([['clean', 'clear-cache'], 'lint', 'bundle:watch']));

gulp.task('build', ['clean-bundle:watch'], bundler.stop.bind(bundler));
gulp.task('build:production', sync(['set-production', 'build', 'html']));

gulp.task('serve:production', sync(['build:production', 'serve']));

gulp.task('watch', sync(['clean-bundle:watch', 'serve']), function watch() {
  bundler.watch();
  gulp.watch(['./src/**/*.*(jsx|js)', './.eslintrc', './gulpfile.js'], ['lint']);
  gulp.watch(['./src/*.html'], ['html']);
  gulp.watch(['./src/**/*.*(less|css)'], ['styles']);
  gulp.watch(['./src/**/*.*(png|jpg|gif|svg)'], ['images']);
});

gulp.task('default', ['build']);
