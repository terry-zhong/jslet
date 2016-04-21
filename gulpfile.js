var gulp = require('gulp');
var uglify = require('gulp-uglify');
var csso = require('gulp-csso');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var jshint = require('gulp-jshint');

gulp.task('jslet-data', function() {
	return gulp.src(['src/umd/jslet-data.prefix.js', 'src/jslet.global.js', 'src/core/*.js', 'src/data/**/*.js', 'src/umd/jslet-data.suffix.js'])
		.pipe(concat('jslet-data.js'))
		.pipe(gulp.dest('dist'))
		.pipe(jshint())
        .pipe(jshint.reporter('default'))
		.pipe(sourcemaps.init())
			.pipe(uglify())
			.pipe(rename('jslet-data.min.js'))
		.pipe(sourcemaps.write('../dist'))
		.pipe(gulp.dest('dist'));
});
gulp.task('jslet-data-licence', ['jslet-data'], function() {
	return gulp.src(['src/umd/licenceprefix', 'dist/jslet-data.min.js'])
	.pipe(concat('jslet-data.min.js'))
	.pipe(gulp.dest('dist'));
});

gulp.task('jslet-ui', function() {
	return gulp.src(['src/umd/jslet-ui.prefix.js', 'src/ui/*.js', 
	                 'src/ui/control/*.js', 
	                 'src/ui/dbcontrol/container/*.js',
	                 'src/ui/dbcontrol/form/jslet.dbplace.js',
	                 'src/ui/dbcontrol/form/jslet.dbtext.js',
	                 'src/ui/dbcontrol/form/jslet.dbcustomcombobox.js',
	                 'src/ui/dbcontrol/form/*.js',
	                 'src/ui/dbcontrol/misc/*.js', 'src/umd/jslet-ui.suffix.js'
	                 ])
		.pipe(jshint())
        .pipe(jshint.reporter('default'))
		.pipe(concat('jslet-ui.js'))
		.pipe(gulp.dest('dist'))
		.pipe(sourcemaps.init())
			.pipe(uglify({mangle: {except: ["$super"]}}))
			.pipe(rename('jslet-ui.min.js'))
		.pipe(sourcemaps.write('../maps'))
		.pipe(gulp.dest('dist'));
});

gulp.task('jslet-ui-licence', ['jslet-ui'], function() {
	return gulp.src(['src/umd/licenceprefix', 'dist/jslet-ui.min.js'])
	.pipe(concat('jslet-ui.min.js'))
	.pipe(gulp.dest('dist'));
});

gulp.task('jslet-default-css', function() {
	return gulp.src(['src/asset/default/jslet-style.css', 
	                 'src/asset/default/*.css'
	                 ])
		.pipe(concat('jslet-css.css'))
		.pipe(gulp.dest('dist/asset/default'))
		.pipe(csso())
	    .pipe(rename({suffix: '-min'}))
		.pipe(gulp.dest('dist/asset/default'));
});

gulp.task('jslet-default-css-img', function() {
	return gulp.src(['src/asset/default/images/**/*.*'])
		.pipe(gulp.dest('dist/asset/default/images'));
});

gulp.task('jslet-lib', function() {
	return gulp.src(['src/lib/**/*.*'])
		.pipe(gulp.dest('dist/lib'));
});

gulp.task('jslet-locale', function() {
	return gulp.src(['src/locale/**/*.*'])
		.pipe(gulp.dest('dist/locale'));
});

gulp.task('default', ['jslet-data-licence', 'jslet-ui-licence', 'jslet-default-css', 'jslet-default-css-img', 'jslet-lib', 'jslet-locale'], function () {  
  
});
  
gulp.task('watch', function () {
   gulp.watch('src/**/*.*', ['default']);
});