# Contributing to LoadSaathi

First off, thank you for taking the time to contribute! 🎉

This project is a **proprietary, closed-source** application. Before contributing,
please read the [LICENSE](LICENSE) carefully. While the code is available for
evaluation, please reach out to the maintainers before submitting significant
changes or external contributions.

## Code of Conduct

By participating in this project, you agree to abide by our
[Code of Conduct](CODE_OF_CONDUCT.md).

## How Can I Contribute?

### Reporting Bugs

1. **Search** the existing [issues](../../issues) to avoid duplicates.
2. If you don't find an existing issue, [create a new one](../../issues/new/choose).
   Use the Bug Report template and include:
   - A clear, descriptive title
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots (if applicable)
   - Environment details (browser, OS, device)

### Suggesting Features

Use the Feature Request template and describe:
- The problem you're trying to solve
- Your proposed solution
- Alternative approaches you considered

### Submitting Code (Internal Team)

1. Fork or clone the repository.
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make your changes.
4. Ensure code passes checks:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```
5. Commit with a descriptive message using [Conventional Commits](#commit-guidelines).
6. Push and open a Pull Request.

## Development Workflow

### Setting Up

```bash
pnpm install
cp .env.example .env
# Fill in your keys
pnpm dev
```

### Coding Standards

This project follows strict conventions. See [`CONTEXT.md`](CONTEXT.md) and
[`AI_RULES.md`](AI_RULES.md) for the full rules. Highlights:

- **TypeScript strict mode** — no `any` types
- **Tailwind CSS exclusively** — no inline styles or CSS modules
- **shadcn/ui components** — never edit files in `src/components/ui/`
- **React Query** for all data fetching — no raw `fetch()` for Supabase
- **React Hook Form + Zod** for all forms
- **lucide-react** for all icons

### Adding a New Page

See the "Quick Reference" section in [`CONTEXT.md`](CONTEXT.md) for
step-by-step guides for adding public pages, protected pages, and modifying
the database schema.

### Database Migrations

1. Edit `src/integrations/supabase/final-schema.sql`
2. Create a migration in `supabase/migrations/` with a date-stamped filename
   (e.g., `20260101_feature_name.sql`)
3. Update types in `src/types/index.ts`
4. Update affected hooks or utils
5. Test with `pnpm build`

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**
- `feat(trucker): add trip cancellation flow`
- `fix(auth): resolve 401 errors on trip mutations`
- `docs: update deployment guide`

## Pull Request Checklist

- [ ] Code passes `pnpm lint`
- [ ] Code passes `pnpm test`
- [ ] Code builds with `pnpm build`
- [ ] Types are correct (`tsc --noEmit`)
- [ ] No secrets or `.env` files committed
- [ ] Conventional commit message used

## Questions?

Contact the maintainers at **support@loadsaathi.in**.
