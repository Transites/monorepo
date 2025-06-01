# frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the frontend directory with the following variables:

```
VITE_CONTRIBUTE_EMAIL=your-email@example.com
VITE_STRAPI_BASE_URL=http://your-strapi-url:1337/api
```

You can also copy the `.env.sample` file and update the values:

```sh
cp .env.sample .env
```

### Available Environment Variables

- `VITE_STRAPI_BASE_URL`: The base URL for the Strapi API (default: http://enciclopedia.iea.usp.br:1337/api)
- `VITE_CONTRIBUTE_EMAIL`: Email address for contribution inquiries
