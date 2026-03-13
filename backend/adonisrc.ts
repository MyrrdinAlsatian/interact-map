const adonisrc = {
  preloads: [{ file: './src/infrastructure/adonis/routes.ts', environment: ['web', 'console'] }],
  providers: ['./providers/app_provider.ts'],
  metaFiles: ['**/*.json', 'resources/views/**/*.edge'],
  commands: ['@adonisjs/core/commands'],
  tests: {
    suites: [
      { name: 'unit', files: ['tests/unit/**/*.spec.ts'] },
      { name: 'integration', files: ['tests/integration/**/*.spec.ts'] },
    ],
  },
}

export default adonisrc
