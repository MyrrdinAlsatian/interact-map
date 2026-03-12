const adonisrc = {
  preloads: [],
  providers: ['./providers/app_provider.ts'],
  metaFiles: ['**/*.json'],
  commands: ['@adonisjs/core/commands'],
  tests: {
    suites: [{ name: 'unit', files: ['tests/unit/**/*.spec.ts'] }],
  },
}

export default adonisrc
