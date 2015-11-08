var gulp = require('gulp');
var cached = require('gulp-cached');
var clone = require('gulp-clone');
var del = require('del');
var livereload = require('gulp-livereload');
var merge = require('event-stream').merge; //require('merge-stream');
var plumber = require('gulp-plumber');
var remember = require('gulp-remember');
var sourcemaps = require('gulp-sourcemaps');
var util = require('gulp-util');

var autoprefixOptions = { browsers: ['> 2%', 'IE 9'] };

var EE = require('events').EventEmitter;
var plumberOptions = {
    errorHandler: function (error) {
        if (EE.listenerCount(this, 'error') < 3) {
            util.log(
                util.colors.cyan('Plumber') + util.colors.red(' found unhandled error:\n'),
                error.toString()
            );
        }
        this.emit('end');
    }
};

var paths = (function () {
    var srcRoot = './client';
    var buildRoot = './wwwroot';

    var srcIndex = srcRoot + '/index.html';

    var excludeBuiltLibs = '!' + buildRoot + '/libs/**';
    var excludeBuiltViews = '!' + buildRoot + '/views/**';

    return {
        tsConfig: './tsconfig.json',
        tsTypings: './typings/**/*.d.ts',

        srcIndex: srcIndex,
        srcHtml: [srcRoot + '/**/*.html', '!' + srcIndex],
        srcLess: [srcRoot + '/**/*.less', '!' + srcRoot + '/**/*.release.less'],
        srcTs: [srcRoot + '/**/*.ts'],
        srcFonts: ['./bower_components/bootstrap/dist/fonts/*.*'],
        srcImg: [srcRoot + '/images/**/*'],

        dest: buildRoot,
        destFonts: buildRoot + '/fonts',
        destImg: buildRoot + '/images',
        destLibs: buildRoot + '/libs',

        builtCssNoViewsOrLibs: [buildRoot + '/**/*.css', excludeBuiltLibs, excludeBuiltViews],
        builtJsNoLibs: [buildRoot + '/**/*.js', excludeBuiltLibs],
        builtJsAndNonViewCss: [buildRoot + '/**/*.js', excludeBuiltViews + '/*.{css,css.map,less}']
    };
})();


// -------------------- build --------------------
var batch = require('gulp-batch');
var runSequence = require('run-sequence').use(gulp);
var watch = require('gulp-watch');

gulp.task('debug:clean', function () {
    cached.caches = {};
    return del([paths.dest]); // , '!' + paths.dest + '/bin/**/*']);
});

gulp.task('debug:build', function (done) {
    runSequence(
        ['debug:compile:templates', 'debug:compile:styles', 'debug:compile:scripts', 'debug:compile:other'],
        'debug:compile:index',
        done);
});

gulp.task('debug:watch', ['debug:build'], function () {
    livereload.listen();

    watch(paths.srcHtml, { verbose: true }, batch({ timeout: 100 }, compileTemplates));

    watch(paths.srcLess, { verbose: true }, batch({ timeout: 100 }, compileStyles));

    watch(paths.srcTs, { verbose: true }, batch({ timeout: 100 }, compileScripts));

    watch(paths.srcImg, { verbose: true }, batch({ timeout: 1000 }, compileImages));

    watch(paths.srcFonts, { verbose: true }, batch({ timeout: 1000 }, compileFonts));

    watch(paths.srcIndex, { verbose: true }, batch({ timeout: 500 }, function (events, done) {
        runSequence('debug:compile:index', done);
    }));

    // if we add or remove any scripts or non-view styles, we want to update the index.
    // Note: this crashes if a watched dir is deleted e.g. by running debug:clean
    watch(
        paths.builtJsAndNonViewCss,
        { verbose: true, events: ['add', 'unlink'] },
        batch({ timeout: 500 }, function (events, done) {
            runSequence('debug:compile:index', done);
        })
    );
});


// ------------------- templates -------------------
var compileTemplates = function (files, done) {
    return files
        .pipe(gulp.dest(paths.dest))
        .pipe(livereload())
        .on('end', done || function () { });
};

gulp.task('debug:clean:templates', function () {
    return del([paths.dest + '/**/*.html']);
});

gulp.task('debug:compile:templates', ['debug:clean:templates'], function (done) {
    compileTemplates(gulp.src(paths.srcHtml), done);
});


// -------------------- styles --------------------
var autoprefixer = require('gulp-autoprefixer');
var less = require('gulp-less');
var progeny = require('gulp-progeny');

var compileStyles = function (files, done) {
    var lessFiles = files
        .pipe(clone())
        .pipe(gulp.dest(paths.dest))
        .pipe(livereload());

    var cssFiles = files
        .pipe(plumber(plumberOptions))
        .pipe(progeny())
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer(autoprefixOptions))
        .pipe(sourcemaps.write('.'))
        .pipe(cached('styles', { optimizeMemory: true }))
        .pipe(gulp.dest(paths.dest))
        .pipe(livereload());

    return merge(lessFiles, cssFiles).on('end', done || function () { });
};

gulp.task('debug:clean:styles', function () {
    if (cached.caches['styles']) {
        delete cached.caches['styles'];
    }
    return del([paths.dest + '/**/*.{css,less,css.map}']);
});

gulp.task('debug:compile:styles', ['debug:clean:styles'], function (done) {
    compileStyles(gulp.src(paths.srcLess), done);
});


// -------------------- scripts -------------------
var ts = require('gulp-typescript');
var tsProject = ts.createProject(paths.tsConfig);

var compileScripts = function (files, done) {
    var tsFiles = files
        .pipe(gulp.dest(paths.dest))
        .pipe(livereload());

    var jsFiles = gulp
        .src([paths.tsTypings].concat(paths.srcTs))
        .pipe(plumber(plumberOptions))
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject))
        .js
        .pipe(sourcemaps.write('.'))
        .pipe(cached('scripts', { optimizeMemory: true }))
        .pipe(gulp.dest(paths.dest))
        .pipe(livereload());

    return merge(tsFiles, jsFiles).on('end', done || function () { });
};

gulp.task('debug:clean:scripts', function () {
    if (cached.caches['scripts']) {
        delete cached.caches['scripts'];
    }
    return del([paths.dest + '/**/*.{js,js.map,ts,d.ts}']);
});

gulp.task('debug:compile:scripts', ['debug:clean:scripts'], function (done) {
    compileScripts(gulp.src(paths.srcTs), done);
});


// ---------------- fonts & images ----------------
var flatten = require('gulp-flatten');

var compileImages = function (files, done) {
    return files
        .pipe(gulp.dest(paths.destImg))
        .on('end', done || function () { });
};

var compileFonts = function (files, done) {
    return files
        .pipe(flatten())
        .pipe(gulp.dest(paths.destFonts))
        .on('end', done || function () { });
};

gulp.task('debug:compile:other', function () {
    var images = compileImages(gulp.src(paths.srcImg));
    var fonts = compileFonts(gulp.src(paths.srcFonts));

    return merge(images, fonts);
});


// -------------------- inject --------------------
var angularFilesort = require('gulp-angular-filesort');
var bowerFiles = require('main-bower-files');
var inject = require('gulp-inject');
var order = require('gulp-order');

gulp.task('debug:compile:index', function () {
    var styles = gulp.src(paths.builtCssNoViewsOrLibs, { read: false });
    var scripts = gulp.src(paths.builtJsNoLibs).pipe(angularFilesort());

    var libraries = gulp
        .src(bowerFiles())
        .pipe(cached('bower', { optimizeMemory: true }))
        .pipe(gulp.dest(paths.destLibs))
        .pipe(livereload())
        .pipe(remember('bower'))
        .pipe(order(['**jquery.js', '**jquery**', '**lodash**', '**angular.**']));

    var index = gulp
        .src(paths.srcIndex)
        .pipe(gulp.dest(paths.dest))
        .pipe(plumber(plumberOptions))
        .pipe(inject(libraries, { name: 'bower', relative: true }))
        .pipe(inject(merge(styles, scripts), { relative: true }))
        .pipe(gulp.dest(paths.dest))
        .pipe(livereload());

    return merge(libraries, index);
});
