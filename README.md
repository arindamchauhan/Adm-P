# Admin Panel - Bijnoor

Full-featured admin panel for Bijnoor e-commerce platform built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Dashboard** - Real-time analytics and metrics
- **Products** - Manage inventory, categories, and pricing
- **Orders** - Track and manage orders, invoices
- **Customers** - Customer management and communication
- **Coupons** - Create and manage discount codes
- **Collaborations** - Manage creator collabs and partnerships
- **Settings** - Site settings and configuration
- **Authentication** - Secure admin login with JWT

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (for data storage)
- Firebase account (for authentication and storage)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/arindamchauhan/adm-p.git
cd adm-p
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

4. Update environment variables in `.env.local` with your credentials

5. Run the development server:
```bash
npm run dev
```

Visit `http://localhost:3000/ADM-P/login` to access the admin panel.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── app/
│   ├── ADM-P/           # Admin panel routes
│   │   ├── dashboard/   # Dashboard page
│   │   ├── products/    # Product management
│   │   ├── orders/      # Order management
│   │   ├── customers/   # Customer management
│   │   ├── coupons/     # Coupon management
│   │   ├── collabs/     # Collaboration management
│   │   ├── inventory/   # Inventory tracking
│   │   ├── settings/    # Site settings
│   │   ├── login/       # Admin login
│   │   └── layout.tsx   # Admin layout
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── components/          # Reusable React components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and helpers
├── models/              # Data models
└── types/               # TypeScript types
```

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel settings
4. Deploy

```bash
vercel deploy
```

### Environment Variables for Production

Make sure to set these in your Vercel project settings:
- `NEXT_PUBLIC_BASE_URL` - Your production URL
- `JWT_SECRET` - Secure secret for JWT
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- Firebase and other service credentials

## API Integration

The admin panel connects to the backend API:
- Base URL: `process.env.NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`)
- Authentication: JWT tokens stored in cookies/localStorage
- Endpoints: `/api/*` (authenticated routes)

## Authentication

- Admin login at `/ADM-P/login`
- JWT token-based authentication
- Secure session management
- Protected routes with role-based access

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Private - Bijnoor Admin Panel

## Support

For issues or questions, contact the development team.
