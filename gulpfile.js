var gulp = require('gulp');
var exec = require('child_process').exec;

var docGlobs = ['meb.js',
                'lib/**'];

gulp.task('jsdoc', function() {
  var cmdHead = 'jsdoc -d docs';
  var cmd = docGlobs.reduceRight(function(x, y) {
    return x + ' ' + y;
  }, cmdHead);

  exec(cmd, function(err, stdout, stderr) {
    if (err !== null) {
      console.log(stderr);
    } else {
      console.log('Compiled JSDoc', stdout);
    }
  });
});

gulp.task('jsdoc-watch', function() {
  gulp.watch(docGlobs, ['jsdoc']);
});

