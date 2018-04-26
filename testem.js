module.exports = {
  test_page: 'tests/index.html?hidepassed',
  disable_watching: true,
  framework: 'mocha',
  // used by CI and `ember test`
  launch_in_ci: [
    'Chrome',
    'Firefox'
  ],
  // used by `ember test --server`
  launch_in_dev: [
    'Chrome'
  ],
  browser_args: {
    Chrome: {
      mode: 'ci',
      args: [
        // --no-sandbox is needed when running Chrome inside a container
        process.env.TRAVIS ? '--no-sandbox' : null,

        '--disable-gpu',
        '--headless',
        '--remote-debugging-port=0',
        '--window-size=1440,900'
      ].filter(Boolean)
    }
  }
}
