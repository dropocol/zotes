# Zotes

A personal CRM and productivity workspace to stay on top of your notes, tasks, projects, mind maps, job hunt, networking contacts, and daily prayers — with a dashboard that ties it all together.

![Zotes](https://img.shields.io/badge/Next.js-16.3-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.3-2D3748?style=flat&logo=prisma)

## Features

### 📊 Dashboard
- KPI band with projects, notes, open tasks, and 30-day job application activity
- Job Hunt panel: applications-per-day bar chart with replies, interviews, weekly pace, streaks, and offer tracking
- Recent notes, active tasks, and recent projects at a glance

### 📝 Notes
- Rich text editor powered by Tiptap (images, links, task lists)
- Organize notes within projects
- Pin important notes for quick access

### 🧠 Mind Maps
- Visual mind maps for brainstorming and planning
- Dedicated editor with create/search/manage overview

### ✅ Todos
- Create and manage todo lists within projects
- Sub-items support (one level deep)
- Priority levels: low, medium, high, urgent
- Due dates with calendar picker
- Status tracking: todo, in-progress, done
- **Recurring todos** with daily, weekly, monthly, and custom frequency options, plus completion history and progress tracking
- **Upcoming view** that aggregates what's due next across lists

### 📁 Projects
- Color-coded projects for visual organization
- Drag-and-drop reordering
- Share projects with collaborators (per-member roles)

### 🕌 Prayer Tracking
- Track daily prayers: Fajr, Zohar, Asr, Maghrib, Isha, and Jumah
- Mark prayer status: Yes, No, or Qazaa (missed)
- Monthly calendar view with per-day completion stats

### 👥 Leads & Contacts
- Lightweight CRM for networking contacts and recruiters
- Contact statuses: New, Reached Out, Replied, In Conversation, Meeting Scheduled, Not Interested, Unresponsive
- KPI stats band (totals per stage) matching the dashboard design
- Contact details: name, email, phone, company, title, LinkedIn URL, custom created date, and notes
- Slide-in drawer editor with search, status filtering, and pagination

### 💼 Job Application Tracker
- Track applications through the entire hiring pipeline: list, calendar, and stats views
- Application statuses: Saved, Applied, Phone Screen, Interview, Offer, Rejected, Withdrawn, No Response
- Record job source, application method, salary range, and location
- **Interview scheduling** with round-based tracking (Phone, Video, Onsite, Technical, Behavioral, Final)
- **Stats view** with activity charts, response/interview rates, average reply time, and streaks

### 🔐 Authentication
- Secure authentication with NextAuth.js v5
- Email/password login with bcrypt hashing
- Signup can be disabled with the `ENABLE_SIGNUP` flag

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **UI**: React 19, TypeScript 5, Tailwind CSS v4
- **Components**: shadcn-style components on Radix UI and Base UI (drawer, sidebar)
- **Charts**: [Recharts](https://recharts.org/)
- **Database**: PostgreSQL 17 (Docker Compose for local dev) with [Prisma ORM 7](https://www.prisma.io/)
- **Auth**: [NextAuth.js v5](https://authjs.dev/) with Prisma adapter
- **Rich Text**: [Tiptap 3](https://tiptap.dev/) editor
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+ (22 recommended)
- Docker (for the Postgres database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dropocol/zotes.git
cd zotes
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database URL and auth secrets:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zotes"
AUTH_SECRET="your-auth-secret-here"
AUTH_URL="http://localhost:3600"
ENABLE_SIGNUP=true
```

4. Start the database and run migrations:
```bash
npm run db:start        # Postgres 17 via Docker Compose
npm run migrate:deploy  # or: npm run db:push for a fresh schema
npm run db:generate
```

5. (Optional) Seed the database:
```bash
npm run db:seed
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3600](http://localhost:3600) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on port 3600 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run db:start` / `db:stop` | Start/stop the Docker Compose Postgres database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:push` | Push schema changes to database |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:studio` | Open Prisma Studio |
| `npm run migrate:dev` | Create and run a new migration |
| `npm run migrate:deploy` | Deploy migrations to production |
| `npm run migrate:reset` | Reset database and rerun migrations |

Commands suffixed with `:prod` (e.g. `db:push:prod`) run the same task against `.env.prod`.

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users** – Authentication and user data
- **Projects** – Organizational containers with color coding
- **ProjectCollaborators** – Per-user project sharing with roles
- **Notes** – Rich text content within projects
- **MindMaps** – Mind map documents
- **TodoLists / TodoItems** – Tasks with recurrence support and sub-items
- **RecurringCompletions** – Completion history for recurring tasks
- **PrayerRecords** – Daily prayer tracking
- **Leads** – Networking contacts with status tracking
- **JobApplications** – Job hunting pipeline tracking
- **JobInterviews** – Interview details and scheduling

## Deployment

Zotes deploys as a standard Node app. On the deployment server (Coolify + Nixpacks) the build runs `npm run db:generate && npm run build` with Node 22, then serves via `npm run start`. Any platform that supports Node + Postgres (Vercel, Fly.io, a VPS behind a reverse proxy) works — just provide the environment variables above.

## Roadmap

- [ ] Theme toggle (dark mode styles are already in place)
- [ ] Calendar view for todos and events
- [ ] Email reminders for upcoming todos
- [ ] Tags and labels system
- [ ] Full-text search across all content
- [ ] Export notes to PDF

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/) and [Base UI](https://base-ui.com/)
- Rich text editing by [Tiptap](https://tiptap.dev/)
- Database ORM by [Prisma](https://www.prisma.io/)
