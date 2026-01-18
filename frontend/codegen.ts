import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: 'http://127.0.0.1:1337/graphql',
  generates: {
    './graphql/types.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        useTypeImports: true,
      },
    },
  },
};

export default config;
