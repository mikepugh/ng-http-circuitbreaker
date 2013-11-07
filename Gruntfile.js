module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-karma');

  grunt.initConfig({

    karma: {
      unit: {
        configFile: './test/karma-unit.conf.js',
        autoWatch: false,
        singleRun: true
      },
      unit_auto: {
        configFile: './test/karma-unit.conf.js',
        autoWatch: true,
        singleRun: false
      },
      unit_coverage: {
        configFile: './test/karma-unit.conf.js',
        autoWatch: false,
        singleRun: true,
        reporters: ['progress', 'coverage'],
        preprocessors: {
          'app/scripts/*.js': ['coverage']
        },
        coverageReporter: {
          type : 'html',
          dir : 'coverage/'
        }
      },
    }
  });

  //single run tests
  grunt.registerTask('test', ['karma:unit']);
  //coverage testing
  grunt.registerTask('test:coverage', ['karma:unit_coverage']);
  //autotest and watch tests
  grunt.registerTask('autotest', ['karma:unit_auto']);


  //defaults
  grunt.registerTask('default', ['test']);

};
