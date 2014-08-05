module.exports = function ( grunt ) {

	grunt.initConfig({

		pkg: grunt.file.readJSON('package.json'),

		meta: {
			banner: '/*! <%= pkg.name %> <%= pkg.version %> - <%= pkg.description %> | Author: <%= pkg.author %>, <%= grunt.template.today("yyyy") %> | License: <%= pkg.license %> */\n'
		},

		concat: {
			dist: {
				options: {
					stripBanners: true,
					banner: '<%= meta.banner %>'
				},
				files: {
					'dist/kist-autosuggest.js': ['src/kist-autosuggest.js'],
					'dist/kist-autosuggest.css': ['src/kist-autosuggest.css']
				}
			}
		},

		uglify: {
			dist: {
				options: {
					banner: '<%= meta.banner %>'
				},
				files: {
					'dist/kist-autosuggest.min.js': ['src/kist-autosuggest.js']
				}
			}
		},

		cssmin: {
			dist: {
				options: {
					banner: '<%= meta.banner %>'
				},
				files: {
					'dist/kist-autosuggest.min.css': ['src/kist-autosuggest.css']
				}
			}
		},

		copy: {
			css: {
				options: {
					process: function ( content, srcpath ) {
						return content.replace(/\*\/\n/g,'*/');
					}
				},
				files: {
					'dist/kist-autosuggest.min.css': ['dist/kist-autosuggest.min.css']
				}
			}
		},

		bump: {
			options: {
				files: ['package.json', 'bower.json'],
				updateConfigs: ['pkg'],
				commit: true,
				commitMessage: 'Release %VERSION%',
				commitFiles: ['-a'],
				createTag: true,
				tagName: '%VERSION%',
				tagMessage: '',
				push: false
			}
		},

		jscs: {
			main: {
				options: {
					config: '.jscsrc'
				},
				files: {
					src: [
						'src/**/*.js'
					]
				}
			}
		},

		jshint: {
			main: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: [
					'src/**/*.js'
				]
			}
		}

	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-bump');

	grunt.registerTask('stylecheck', ['jshint:main', 'jscs:main']);
	grunt.registerTask('default', ['stylecheck', 'concat', 'uglify', 'cssmin', 'copy:css']);
	grunt.registerTask('releasePatch', ['bump-only:patch', 'default', 'bump-commit']);
	grunt.registerTask('releaseMinor', ['bump-only:minor', 'default', 'bump-commit']);
	grunt.registerTask('releaseMajor', ['bump-only:major', 'default', 'bump-commit']);

};
