
module.exports = function(grunt) {

  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      gruntfile: {
        src: 'gruntfile.js'
      },
      lib: {
        src: 'lib/**/*.js'
      },
      unit: {
        src: 'test/**/*.js'
      },
      global: {
        src: 'build/global.js'
      },
      demo: {
        src: 'demo/js/src/*.js'
      },
    },

    simplemocha: {
      options: {
        timeout: 3000,
        slow: 5000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec',
        path: 'test'
      },
      unit: {
        src: 'test/*.js',
      },
    },

    browserify: {
      global: {
        files: {
          'build/qhull.js': ['build/global.js'],
        },
      },
      demo: {
        files: {
          'demo/js/build.js': ['demo/js/src/demo.js'],
        },
      },
    },

    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      lib: {
        files: '<%= jshint.lib.src %>',
        tasks: ['jshint:lib', 'simplemocha:unit', 'browserify:demo'],
      },
      unit: {
        files: '<%= jshint.unit.src %>',
        tasks: ['jshint:unit', 'simplemocha:unit'],
      },
      global: {
        files: '<%= jshint.global.src %>',
        tasks: ['jshint:global', 'browserify:global'],
      },
      demo: {
        files: '<%= jshint.demo.src %>',
        tasks: ['jshint:demo', 'browserify:demo'],
      },
    },

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-browserify');

  // Unit testing
  grunt.registerTask('unit', ['jshint:lib','jshint:unit', 'simplemocha:unit']);
  grunt.registerTask('default', ['jshint', 'unit', 'browserify']);

};
