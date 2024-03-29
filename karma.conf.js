// Karma configuration
module.exports = function(config) {
    config.set({
      
      basePath: '',
      frameworks: ['jasmine', 'browserify'],
  
  
      files: [
        'src/tests/*.ts'
      ],
  
  
      exclude: [
      ],
  
  
      preprocessors: {
        'src/tests/*.js': [ 'browserify' ],
        'src/tests/*.ts': [ 'browserify' ]
      },
  
  
      plugins: [
          require ('karma-browserify'),
          require('karma-jasmine'),
          require('karma-chrome-launcher'),
          require('karma-spec-reporter'),
          require('karma-jasmine-html-reporter')
      ],
      
      reporters: ['spec','kjhtml'],
  
  
      port: 9876,
  
  
      colors: true,
      
      logLevel: config.LOG_DEBUG,
  
  
      autoWatch: true,
  
  
      browsers: ['Chrome'],
  
  
      client: {
         clearContext: false
      },
      
      singleRun: false,
  
  
      concurrency: Infinity,
    })
  }
  