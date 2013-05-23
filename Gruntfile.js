module.exports = function (grunt) {
	grunt.initConfig({
		jshint: {
			files: [ 'Gruntfile.js', 'index.js', 'lib/**/*.js', 'spec/**/*.js' ]
		},
		simplemocha: {
			options: {
				ignoreleaks: false,
				ui: 'bdd',
				reporter: 'spec'
			},
			all: { src: 'spec/**/*.js' }
		},
		watch: {
			files: [ '**/*.js' ],
			tasks: [ 'jshint', 'simplemocha' ]
		}
	});


	grunt.loadNpmTasks('grunt-simple-mocha');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-notify');

	grunt.registerTask('default', [ 'jshint', 'simplemocha' ]);
};