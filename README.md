# Zotes

A personal CRM and productivity tool designed to help you stay organized with notes, tasks, projects, job applications, networking contacts, and daily prayer tracking.

![Zotes](https://img.shields.io/badge/Next.js-16.1-black?style=flat&logo=next.js)
![React](https://img.shields.io/badge/React-19.2-blue?style=flat&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7.3-2D3748?style=flat&logo=prisma)

## Features

### 📝 Notes
- Rich text editor powered by Tiptap
- Organize notes within projects
- Pin important notes for quick access

### ✅ Todos
- Create and manage todo lists
- Sub-items support (one level deep)
- Priority levels: low, medium, high, urgent
- Due dates with calendar picker
- Status tracking: todo, in-progress, done
- **Recurring todos** with daily, weekly, monthly, and custom frequency options
- Track completion history for recurring tasks

### 📁 Projects
- Color-coded projects for visual organization
- Drag-and-drop reordering
- Share projects with collaborators

### 🕌 Prayer Tracking
- Track daily prayers: Fajr, Zohar, Asr, Maghrib, Isha, and Jumah
- Mark prayer status: Yes, No, or Qazaa (missed)
- Daily prayer history and statistics

### 👥 Leads & Contacts
- Track networking contacts and recruiters during your job search
- Contact statuses: New, Reached Out, Replied, In Conversation, Meeting Scheduled, Not Interested, Unresponsive
- Store contact details: name, email, phone, company, title, LinkedIn URL
- Add notes for each contact
- Search and filter by status or keywords
- Pagination for large contact lists

### 💼 Job Application Tracker
- Track job applications through the entire hiring pipeline
- Application statuses: Saved, Applied, Phone Screen, Interview, Offer, Rejected, Withdrawn, No Response
- Record job source and application method
- Track salary ranges and location details
- **Interview scheduling** with multiple interview types (Phone, Video, Onsite, Technical, Behavioral, Final)
- Round-based interview tracking with notes

### 🔐 Authentication
- Secure authentication with NextAuth.js v5
- Email/password login with bcrypt hashing

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI**: React 19, TypeScript, Tailwind CSS v4
- **Components**: Radix UI primitives
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Auth**: [NextAuth.js v5](https://authjs.dev/)
- **Rich Text**: [Tiptap](https://tiptap.dev/) editor
- **Drag & Drop**: [@dnd-kit](https://dndkit.com/)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 20+ 
- PostgreSQL database
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/zotes.git
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

Edit `.env` with your database URL and authentication secret:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/zotes"
AUTH_SECRET="your-auth-secret-here"
```

4. Run database migrations:
```bash
npx prisma migrate deploy
npx prisma generate
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
| `npm run db:seed` | Seed database with sample data |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run migrate:dev` | Create and run a new migration |
| `npm run migrate:deploy` | Deploy migrations to production |
| `npm run migrate:reset` | Reset database and rerun migrations |

## Database Schema

The application uses a PostgreSQL database with the following main entities:

- **Users** - Authentication and user data
- **Projects** - Organizational containers with color coding
- **Notes** - Rich text content stored as markdown
- **TodoLists** - Containers for todo items
- **TodoItems** - Tasks with recurrence support and sub-items
- **PrayerRecords** - Daily prayer tracking
- **Leads** - Networking contacts with status tracking
- **JobApplications** - Job hunting pipeline tracking
- **JobInterviews** - Interview details and scheduling

## Roadmap

- [ ] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Export notes to PDF
- [ ] Calendar view for todos and events
- [ ] Email reminders for upcoming todos
- [ ] Tags and labels system
- [ ] Full-text search across all content

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
- UI components from [Radix UI](https://www.radix-ui.com/)
- Rich text editing by [Tiptap](https://tiptap.dev/)
- Database ORM by [Prisma](https://www.prisma.io/)
