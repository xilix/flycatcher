module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.initConfig({
    mochaTest: {
      test: {
        options: {
          reporter: 'nyan',
          quiet: false
        },
        src: ['test/mocha/*.js']
      }
    }
  });

  grunt.registerTask('default', 'mochaTest');

};
