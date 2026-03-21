# WorkSyncAI Project Rules

- **Type Safety**: Always use TypeScript in strict mode. Explicitly type all variables and function returns.
- **Error Handling**: Every API route MUST be wrapped in a try/catch block and return appropriate HTTP status codes.
- **ORM Usage**: Use Prisma exclusively for database operations. Avoid raw SQL queries.
- **Components**: 
  - Component names must be in PascalCase.
  - Filenames must be in kebab-case.
  - Prefer functional components with hooks.
- **Styling**: Use Tailwind CSS for all styling. Follow the existing shadcn/ui design system patterns.
- **State Management**: Use React state for local UI logic and Server Components/Prisma for data fetching.
- **Authentication**: All protected routes must check for Clerk authentication via middleware or server-side checks.
