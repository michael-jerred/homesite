var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var clone = require('gulp-clone');
var concat = require('gulp-concat');
var del = require('del');
var filter = require('gulp-filter');
var merge = require('event-stream').merge;
var minifyCss = require('gulp-minify-css');
var plumber = require('gulp-plumber');
var uglify = require('gulp-uglify');

var autoprefixOptions = { browsers: ['> 2%'] };
var paths = (function () {
    var srcRoot = './client';
    var buildRoot = './wwwroot';

    var srcIndex = srcRoot + '/index.html';

    return {
        tsConfig: './tsconfig.json',
        tsTypings: './typings/**/*.d.ts',

        srcIndex: srcIndex,
        srcHtml: [srcRoot + '/**/*.html', '!' + srcIndex],
        srcLess: [srcRoot + '/**/*.less', '!' + srcRoot + '/**/*.debug.less'],
        srcTs: [srcRoot + '/**/*.ts'],
        srcFonts: ['./bower_components/bootstrap/dist/fonts/*.*'],
        srcImg: [srcRoot + '/images/**/*'],

        dest: buildRoot,
        destFonts: buildRoot + '/fonts',
        destImg: buildRoot + '/images'
    };
})();


// -------------------- build --------------------
var inject = require('gulp-inject');

gulp.task('release:clean', function (done) {
    del([paths.dest, '!' + paths.dest + '/bin/**/*'], done);
});

gulp.task('release:build', ['release:clean'], function () {
    var allStyles = compileStyles();

    var templates = compileTemplates(allStyles.pipe(filter(['views/**/*'])));

    var styles = allStyles
        .pipe(clone())
        .pipe(filter(['**/*', '!views/**/*']))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest(paths.dest));

    var scripts = compileScripts();

    var libraries = compileBower();
    var images = copyImages();
    var fonts = copyFonts();

    var index = gulp
        .src(paths.srcIndex)
        .pipe(gulp.dest(paths.dest))
        .pipe(inject(libraries, { name: 'bower', relative: true }))
        .pipe(inject(merge(styles, scripts), { relative: true }))
        .pipe(inject(templates, { name: 'templates', relative: true }))
        .pipe(gulp.dest(paths.dest));

    return merge(templates, styles, scripts, libraries, images, fonts, index);
});

// ------------------- styles -------------------
var less = require('gulp-less');

var compileStyles = function () {
    return gulp
        .src(paths.srcLess)
        .pipe(plumber())
        .pipe(less())
        .pipe(autoprefixer(autoprefixOptions))
        .pipe(minifyCss({ keepSpecialComments: false }));
};

//------------------ templates ------------------
var angularTemplateCache = require('gulp-angular-templatecache');

var compileTemplates = function (viewStyles) {
    var htmlFiles = gulp.src(paths.srcHtml);

    return merge(htmlFiles, viewStyles)
        .pipe(angularTemplateCache('templates.js', { module: 'fm.templates' }))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dest));
};

// ------------------- scripts ------------------
var angularFilesort = require('gulp-angular-filesort');
var ts = require('gulp-typescript');
var tsProject = ts.createProject(paths.tsConfig);

var compileScripts = function () {
    return gulp
        .src([paths.tsTypings].concat(paths.srcTs))
        .pipe(plumber())
        .pipe(ts(tsProject))
        .js
        .pipe(angularFilesort())
        .pipe(concat('scripts.js'))
        .pipe(uglify())
        .pipe(gulp.dest(paths.dest));
};

// -------------------- bower --------------------
var bowerFiles = require('main-bower-files');
var order = require('gulp-order');

var compileBower = function () {
    var filterJs = filter(['*.js'], { restore: true });
    var filterCss = filter(['*.css'], { restore: true });

    return gulp
        .src(bowerFiles())
        .pipe(order(['**jquery.js', '**jquery**', '**lodash**', '**angular.**']))
        .pipe(filterJs)
        .pipe(concat('libraries.js'))
        .pipe(uglify())
        .pipe(filterJs.restore)
        .pipe(filterCss)
        .pipe(autoprefixer(autoprefixOptions))
        .pipe(minifyCss({ keepSpecialComments: false }))
        .pipe(concat('libraries.css'))
        .pipe(filterCss.restore)
        .pipe(gulp.dest(paths.dest));
};

// --------------- fonts & images ---------------
var flatten = require('gulp-flatten');

var copyImages = function () {
    return gulp
        .src(paths.srcImg)
        .pipe(gulp.dest(paths.destImg));
};

var copyFonts = function () {
    return gulp
        .src(paths.srcFonts)
        .pipe(flatten())
        .pipe(gulp.dest(paths.destFonts));
};