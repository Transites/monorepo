# 🚀 Getting started with Strapi

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

## 🔒 Authentication and Permissions

The application now uses a combination of approaches to handle authentication:

1. **Trusted Origins**: Requests from trusted origins (localhost:8080 and enciclopedia.iea.usp.br) are automatically authenticated with a dummy admin user, bypassing the need for a valid JWT token.

2. **Default JWT Token**: The frontend automatically sets a dummy JWT token in localStorage if one doesn't exist. This token is included in all API requests.

3. **Manual Authentication**: If you need to authenticate as a specific user, you can still obtain a JWT token:
   ```
   curl -X POST http://localhost:1337/api/auth/local \
     -H 'Content-Type: application/json' \
     -d '{"identifier":"your-email@example.com","password":"your-password"}'
   ```
   Then set it in localStorage:
   ```
   localStorage.setItem('jwt', 'YOUR_JWT_TOKEN')
   ```
   Replace 'YOUR_JWT_TOKEN' with the token you received

### Permissions Configuration

If you're still experiencing 403 Forbidden errors, you may need to configure the permissions in the Strapi admin panel:

1. Log in to your Strapi admin panel (usually at http://localhost:1337/admin)
2. Go to Settings > USERS & PERMISSIONS PLUGIN > Roles
3. Click on the "Public" role
4. In the Permissions section, find "Submission" and enable the following permissions:
   - create
   - find
   - findOne
   - update
5. Find "Upload" and enable the following permissions:
   - upload
6. Click "Save" to apply the changes

The frontend automatically includes the JWT token in all API requests.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
