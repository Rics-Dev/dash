# Fideligo Dashboard

A modern, full-stack loyalty management dashboard built with SvelteKit, featuring comprehensive analytics, user management, articles, transactions, and rewards systems. The application includes a beautiful UI built with shadcn/ui components and Tailwind CSS.

## 🚀 Features

- **Dashboard Analytics** - Comprehensive overview with charts and metrics
- **User Management** - Complete user administration system
- **Article Management** - Content management with CRUD operations
- **Transaction System** - Financial transaction tracking and management
- **Rewards Program** - User rewards and loyalty system
- **Authentication** - Secure login and session management
- **Responsive Design** - Mobile-first, responsive UI components
- **Dark Mode** - Full dark/light theme support
- **Modern UI** - Beautiful components built with shadcn/ui

## 🛠️ Tech Stack

### Frontend

- **[SvelteKit](https://kit.svelte.dev/)** - Full-stack web framework
- **[Svelte 5](https://svelte.dev/)** - Latest version with improved reactivity
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, accessible UI components

### UI Components & Libraries

- **[bits-ui](https://bits-ui.com/)** - Headless UI primitives
- **[Lucide Icons](https://lucide.dev/)** - Beautiful, customizable icons
- **[Embla Carousel](https://www.embla-carousel.com/)** - Lightweight carousel library
- **[LayerChart](https://layerchart.com/)** - Advanced charting components
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Vaul](https://vaul.emilkowal.ski/)** - Drawer component

### Development Tools

- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[ESLint](https://eslint.org/)** - Code linting
- **[Prettier](https://prettier.io/)** - Code formatting
- **[Bun](https://bun.sh/)** - Fast package manager and runtime

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **Bun** (recommended) or npm/pnpm/yarn
- **Git**

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd fideligo-dashboard
```

### 2. Install Dependencies

Using Bun (recommended):

```bash
bun install
```

Or using npm:

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory and add your environment variables:

```env
# API Configuration
SPRING_API_URL=your_api_url_here

# Add other environment variables as needed
```

### 4. Start Development Server

```bash
bun run dev
```

Or with npm:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

To automatically open the app in your browser:

```bash
bun run dev -- --open
```

## 📂 Project Structure

```
fideligo-dashboard/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/           # shadcn/ui components
│   │   │   ├── Header.svelte
│   │   │   └── Sidebar.svelte
│   │   ├── server/           # Server-side utilities
│   │   │   ├── api.ts        # API client
│   │   │   ├── auth.ts       # Authentication
│   │   │   ├── users.ts      # User management
│   │   │   ├── articles.ts   # Article operations
│   │   │   ├── transactions.ts
│   │   │   └── rewards.ts
│   │   ├── utils/            # Utility functions
│   │   └── assets/           # Static assets
│   ├── routes/
│   │   ├── (app)/           # Protected app routes
│   │   │   ├── dashboard/   # Dashboard page
│   │   │   ├── users/       # User management
│   │   │   ├── articles/    # Article management
│   │   │   ├── transactions/
│   │   │   └── rewards/
│   │   ├── login/           # Authentication
│   │   ├── +layout.svelte   # Root layout
│   │   └── +error.svelte    # Error page
│   ├── app.html             # HTML template
│   ├── app.css              # Global styles
│   └── hooks.server.ts      # Server hooks
├── static/                  # Static files
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 🧞 Available Scripts

| Command               | Description                     |
| --------------------- | ------------------------------- |
| `bun run dev`         | Start development server        |
| `bun run build`       | Build for production            |
| `bun run preview`     | Preview production build        |
| `bun run check`       | Run type checking               |
| `bun run check:watch` | Run type checking in watch mode |
| `bun run lint`        | Run ESLint and Prettier checks  |
| `bun run format`      | Format code with Prettier       |

## 🏗️ Building for Production

To create a production version of your app:

```bash
bun run build
```

You can preview the production build with:

```bash
bun run preview
```

## 🚀 Deployment

This project uses `@sveltejs/adapter-auto` which automatically selects the appropriate adapter based on your deployment environment.

### Supported Platforms

- **Vercel**
- **Netlify**
- **Cloudflare Pages**
- **Node.js** servers

For specific deployment environments, you may need to install a different [adapter](https://svelte.dev/docs/kit/adapters).

### Environment Variables

Make sure to set up your environment variables in your deployment platform:

- `SPRING_API_URL` - Your backend API URL

## 🎨 UI Components

This project uses a comprehensive design system built on top of shadcn/ui:

### Available Components

- **Navigation**: Breadcrumbs, Menubar, Pagination
- **Layout**: Cards, Separators, Tabs
- **Forms**: Inputs, Selects, Checkboxes, Radio Groups
- **Feedback**: Alerts, Dialogs, Tooltips, Progress
- **Data Display**: Tables, Badges, Avatars
- **Charts**: Advanced charting with LayerChart

### Theming

The app supports both light and dark themes with CSS custom properties. Theme switching is handled by the `mode-watcher` library.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

Run `bun run lint` to check code style and `bun run format` to format code.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [SvelteKit documentation](https://kit.svelte.dev/docs)
2. Browse the [issues](https://github.com/your-repo/issues) on GitHub
3. Create a new issue if needed

## 🙏 Acknowledgments

- [SvelteKit](https://kit.svelte.dev/) team for the amazing framework
- [shadcn](https://ui.shadcn.com/) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
