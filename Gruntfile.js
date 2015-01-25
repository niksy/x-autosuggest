/* jshint node:true */

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
					'dist/<%= pkg.name %>.js': ['compiled/<%= pkg.main %>'],
					'dist/<%= pkg.name %>.css': ['compiled/lib/style/index.css']
				}
			}
		},

		uglify: {
			dist: {
				options: {
					banner: '<%= meta.banner %>'
				},
				files: {
					'dist/<%= pkg.name %>.min.js': ['compiled/<%= pkg.main %>']
				}
			}
		},

		cssmin: {
			dist: {
				options: {
					banner: '<%= meta.banner %>'
				},
				files: {
					'dist/<%= pkg.name %>.min.css': ['compiled/lib/style/index.css']
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
						'<%= pkg.main %>',
						'lib/**/*.js'
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
					'<%= pkg.main %>',
					'lib/**/*.js'
				]
			}
		},

		sass: {
			options: {
				sourcemap: 'none'
			},
			main: {
				files: {
					'compiled/lib/style/index.css': '<%= pkg.style %>'
				}
			}
		},

		browserify: {
			options: {
				browserifyOptions: {
					standalone: 'jQuery.fn.autosuggest'
				}
			},
			standalone: {
				options: {
					plugin: ['bundle-collapser/plugin']
				},
				files: {
					'compiled/<%= pkg.main %>': '<%= pkg.main %>'
				}
			}
		},

		connect: {
			test:{
				options: {
					open: true
				}
			}
		},

		'compile-handlebars': {
			test: {
				templateData: {
					bower: '../../../bower_components',
					compiled: '../../../compiled',
					assets: 'assets',
					main: '<%= pkg.main %>',
					url: grunt.option('watch-vm') ? '10.0.2.2' : '0.0.0.0',
					vm: grunt.option('watch-vm')
				},
				partials: 'test/manual/templates/partials/**/*.hbs',
				template: 'test/manual/templates/*.hbs',
				output: 'compiled/test/manual/*.html'
			}
		},

		copy: {
			test: {
				files:[{
					expand: true,
					cwd: 'test/manual/assets/',
					src: ['**'],
					dest: 'compiled/test/manual/assets/'
				}]
			},
			css: {
				options: {
					process: function ( content, srcpath ) {
						return content.replace(/\*\/\n/g,'*/');
					}
				},
				files: {
					'dist/<%= pkg.name %>.min.css': ['dist/<%= pkg.name %>.min.css']
				}
			}
		},

		concurrent: {
			options: {
				logConcurrentOutput: true
			},
			test: ['watch','connect:test:keepalive','nodemon:test']
		},

		watch: {
			hbs: {
				files: 'test/manual/**/*.hbs',
				tasks: ['compile-handlebars:test']
			},
			sass: {
				files: ['lib/**/*.scss'],
				tasks: ['sass:main']
			},
			browserify: {
				files: ['<%= pkg.main %>', 'lib/**/*.js'],
				tasks: ['browserify:standalone']
			}
		},

		nodemon: {
			test: {
				script: 'test/server/server.js'
			}
		}

	});

	require('load-grunt-tasks')(grunt);

	grunt.registerTask('test', function () {
		var tasks = ['compile-handlebars:test','copy:test','sass:main','browserify:standalone'];
		if ( grunt.option('watch') || grunt.option('watch-vm') ) {
			tasks.push('concurrent:test');
		}
		grunt.task.run(tasks);
	});

	grunt.registerTask('stylecheck', ['jshint:main', 'jscs:main']);
	grunt.registerTask('default', ['stylecheck', 'sass:main', 'browserify:standalone', 'concat', 'uglify', 'cssmin', 'copy:css']);
	grunt.registerTask('releasePatch', ['bump-only:patch', 'default', 'bump-commit']);
	grunt.registerTask('releaseMinor', ['bump-only:minor', 'default', 'bump-commit']);
	grunt.registerTask('releaseMajor', ['bump-only:major', 'default', 'bump-commit']);

};
