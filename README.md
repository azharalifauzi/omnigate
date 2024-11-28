# Omnigate: The Ultimate Next.js Boilerplate for Self-Hosting

This boilerplate is your one-stop solution for building full-stack, production-ready applications with built-in authentication. Whether you're a solo developer or part of a team, this project ensures a top-notch Developer Experience (DX) and smooth deployment process. So you can focus on what matters like building and shipping features.

#### 🔐 Built-In Authentication Without Third-Party Dependencies

Say goodbye to expensive third-party services! This boilerplate comes with a robust, built-in authentication system that supports:

- **Google Sign-In**
- **OTP-based Passwordless Login**
- **Role-Based Access Permissions**
- **Organization Management**
- **UI Dashboard for Managing Users**

It's ready to use out of the box, easily extensible, and gives you complete control over your data and user management.

https://github.com/user-attachments/assets/b68220d7-2a95-45f0-bf5d-ddc95513ffb2

## 🚀 Features

### ⚡ Developer Experience

- **Zero Hassle Dev Mode**: Start your app instantly with minimum setup. No CORS issues, no Docker requirement during development—just code and go.
- **Preconfigured Scripts**: Everything is set up for you—dev, test, build, lint, lint-staged, pre-commit hooks—it just works out of the box.

### 🛠️ Tech Stack

- **Frontend**:
  - [Next.js](https://nextjs.org/)
  - [shadcn](https://ui.shadcn.com/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [@tanstack/react-query](https://tanstack.com/query/v4)
- **Backend**:
  - 🔥 [Hono.js](https://hono.dev/)
  - [PostgreSQL](https://www.postgresql.org/)
  - [Drizzle ORM](https://orm.drizzle.team/)
  - **Hono RPC** for fully type-safe API calls between frontend and backend.

### 🔐 Authentication

- Built-in support for:
  - **Google Sign-In**
  - **OTP-based passwordless login**
- **Role-Based Access Permissions**: Define and enforce permissions based on user roles seamlessly.
- **Organization Support**: Manage multiple organizations with role-specific access within each organization.
- **Built-in Dashboard UI**: Manage authentication related stuff using well crafted UI under `/admin` path.

### 🚢 Deployment Made Easy

- **Dockerized Deployment**: Comes with Docker Compose and optimized Dockerfiles, making it a breeze to deploy to platforms like [Coolify](https://coolify.io/) or [Caprover](https://caprover.com/).
- **Small Docker Image Size**: It only takes up 400 MB for all services (Frontend, Backend, and Nginx).

### 🌟 Full Control

- No need for paid third-party services for simple tasks like rate limiting, websockets, cron jobs, or authentication. This boilerplate gives you full control of your data and backend services.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/)
- [PostgreSQL](https://www.postgresql.org/)

### Installation

```bash
# Clone this repo
git clone https://github.com/azharalifauzi/omnigate
cd omnigate

# Instal packages
pnpm install

# Copy environment and set values for all of them
cp .env.example .env
```

### Setting up Database

You need to install PostgreSQL and create a database first. After that you have to set the `DATABASE_URL` inside `.env` file.

**Important**: before run `pnpm seed` you have to set values for `INITIAL_USER_EMAIL` and `INITIAL_USER_NAME` inside `.env` file.

```bash
# Migrate DB
pnpm migrate

# Seed DB
pnpm seed
```

Once you seed the DB, you'll see `DEFAULT_ORG_ID` in the terminal. Copy the value from terminal to `DEFAULT_ORG_ID` in `.env`.

### Development

```bash
pnpm dev
```

Frontend and backend start together with full type safety and no CORS issues.

### Production Build

```bash
pnpm build
```

### Testing

**Important**: Before run the test, you need to create another database specific for testing purpose, so your database that is used for development won't losing the data.

```bash
pnpm test:unit
```

## 🔨 Useful Utility and Hooks

### Accessing User and Permission Data

Easily retrieve user information and manage permissions in both client and server components with these utilities.

#### **Client Components**

Use the `useUser` hook to access user details and check permissions in client components.

```tsx
'use client'
import { useUser } from '~/hooks'

function Component() {
  const { user, getPermission } = useUser()

  const isGranted = getPermission('read:data')

  if (!isGranted) {
    return null
  }

  return (
    <div>
      <div>Name: {user.name}</div>
      <div>Email: {user.email}</div>
    </div>
  )
}
```

#### **Server Components**

In server components, use the `getServerSideUserObject` utility for similar functionality.

```ts
import { getServerSideUserObject } from '~/utils/server'

function Page() {
  const { user, getPermission } = getServerSideUserObject()
}
```

#### **Advanced Permission Checks**

You can also check multiple permissions with helper functions like `somePermissions` and `everyPermissions`.

```ts
import { somePermission, everyPermission } from '~/utils/auth'

function Component() {
  const { getPermission } = useUser()

  // Will return true if user has one of the permissions
  const canReadOrWriteRole = getPermission(
    somePermissions(['write:roles', 'read:roles']),
  )

  // Will return true when user has all the permissions
  const canReadAndWriteRole = everyPermission(
    everyPermissions(['write:roles', 'read:roles']),
  )
}
```

## 📦 Deployment

Deploy easily using Docker:

```bash
# App wil run on port 3000
docker-compose up --build
```

## 📜 License

This project is licensed under the MIT License.

## 📃 TODO:

- [ ] Write tests
- [x] Documentation
- [x] Google sign in
- [x] Homepage
- [ ] Feature Flags
- [x] Fix and improve ESlint setup
- [x] Add lint staged
