
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
        src: [
          'lib/**/*.js',
        ]
      },
      unit: {
        src: [
          'test/**/*.js',
        ]
      },
      examples: {
        src: [
          'examples/js/src/*.js',
        ]
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
      options: {
        // debug: true,
        shim: {
          jquery: {
            path: 'public/lib/jquery-2.1.0.min.js',
            exports: '$'
          },
        },
        external: ['jquery']
      },
      examples: {
        files: {
          'examples/js/index.js': ['examples/js/src/example.js'],
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
        tasks: ['jshint:lib', 'simplemocha:unit', 'browserify:examples'],
      },
      unit: {
        files: '<%= jshint.unit.src %>',
        tasks: ['jshint:unit', 'simplemocha:unit'],
      },
      examples: {
        files: '<%= jshint.examples.src %>',
        tasks: ['jshint:examples', 'browserify:examples'],
      },
    },

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-browserify');

  // Unit testing
  grunt.registerTask('unit', ['jshint:lib','jshint:unit', 'simplemocha:unit']);
  grunt.registerTask('test', ['unit']);
  grunt.registerTask('default', ['test']);

};
