var gulp = require('gulp');
var babel = require('gulp-babel');
var exec = require('child_process').exec;
var nodemon = require('gulp-nodemon');

gulp.task('bundle-transpile-frontend', function() {
 exec('webpack', function(err, stdout, stderr) {
   console.log(stdout);
   console.log(stderr);
   console.log(err);
 });
});

gulp.task('transpile-backend', function() {
  return gulp.src('./server/**/*.js')
          .pipe(babel({
            presets: ['es2015']
          }))
          .pipe(gulp.dest('dist/server'));
});

gulp.task(
  'default', [
    'bundle-transpile-frontend',
    'transpile-backend'
  ], function() {
    nodemon({
      script: './dist/server/server.js',
      ext: 'js'
    });
  });
