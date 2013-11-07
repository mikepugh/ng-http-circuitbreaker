module.exports = function(config) {
  config.set({
    files : [
      'lib/angular-1.2.0-rc.2/angular.js',
      'lib/angular-1.2.0-rc.2/angular-mocks.js',
      'app/scripts/ng-http-circuitbreaker.js',
      'test/unit/**/*.js'
    ],
    basePath: '../',
    frameworks: ['jasmine'],
    reporters: ['progress'],
    browsers: ['PhantomJS'],
    autoWatch: false,
    singleRun: true,
    colors: true
  });
};
