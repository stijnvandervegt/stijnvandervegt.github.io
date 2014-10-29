module.exports = function(grunt) {
    grunt.initConfig({        
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            main: {
                files: [
                    {
                        expand: true,
                        src: ['app/data/*'],
                        dest: 'static/data',
                        flatten: true,
                        filter: 'isFile'
                    }
                ]
            }
        },
        concat: {
            options: {
                seperator: ';'
            },
            dist: {
                src: [                                       
                    'js/components/underscore/underscore.js',                                       
                    'js/components/satnav/dist/satnav.js',
                    'js/components/hammerjs/hammer.js',
                    'js/main.js'
                ],
                dest: 'static/js/all.js'
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            dist: {
                files: {
                    'static/js/all.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        sass: {
            dev: {
                options: {
                style: 'expanded',
                banner: 'Sass',
                compass: false
            },
            files: {
                'static/css/style.css': 'scss/*.scss'
            }
          },
          dist: {
            options: {
                style: 'compressed',
                compass: false
            },
            files: {
                'static/css/style.css': 'scss/*.scss'
            }
          }
        },       
        watch: {
            scripts: {
                files: ['**/*.js'],
                tasks: ['concat']
            },
            sass: {
                files: 'scss/{,*/}*.{scss,sass}',
                tasks: ['sass:dev']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'uglify']);

};