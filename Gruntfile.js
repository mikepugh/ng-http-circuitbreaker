module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
        dist: {
            files: {
                'dist/<%= pkg.name %>.min.js': ['app/scripts/ng-http-circuitbreaker.js']
            }
        }
    },
    copy: {
        main: {
            files: [
                {src: ['app/scripts/ng-http-circuitbreaker.js'], dest: 'dist/<%=pkg.name %>.js' },
            ]
        }
    },
    jshint: {
        options: {
            smarttabs: true,
            curly: true,
            eqeqeq: true,
            immed: true,
            newcap: true,
            noarg: true,
            sub: true,
            eqnull: true,
            unused: true,
            browser: true,
            validthis: true,
            strict: true,
            latedef: true,
            globals: {
                angular: true
            }
        },
        source: {
            src: ['app/scripts/ng-http-circuitbreaker.js']
        }
    },
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
  grunt.registerTask('test', ['jshint','karma:unit']);
  //coverage testing
  grunt.registerTask('test:coverage', ['jshint','karma:unit_coverage']);
  //autotest and watch tests
  grunt.registerTask('autotest', ['jshint','karma:unit_auto']);


  grunt.registerTask('build', ['jshint','karma:unit','copy:main','uglify']);

  //defaults
  grunt.registerTask('default', ['test']);

};
