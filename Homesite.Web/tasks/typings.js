var gulp = require('gulp');
var util = require('gulp-util');
var shell = require('gulp-shell');
var bower = require('gulp-bower');

gulp.task('bower', function () {
    return bower().pipe(gulp.dest('bower_components/'));
});

gulp.task('tsd:update', function () {
    var bower = require('../bower.json');

    var dependencies = Object.keys(bower.dependencies).filter(function (key) {
        switch (key) {
            case 'bootstrap': return false;
            default: return true;
        }
    });

    var command = 'tsd install ' + dependencies.join(' ') + ' -ros';

    util.log('> ' + command);

    return gulp.src('').pipe(shell(command));
});
