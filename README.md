# Travel Planner

A modern web application for planning and managing your trips, built with Next.js 14, TypeScript, and Tailwind CSS. This application helps users organize their travel plans by managing flights, accommodations, and activities all in one place.

## Features

- ✈️ **Flight Search & Booking**: Search and compare flights using Google Flights data
- 🏨 **Accommodation Management**: (Coming Soon) Track and manage your hotel bookings
- 🎯 **Activity Planning**: (Coming Soon) Plan and organize your trip activities
- 📅 **Trip Timeline**: Visualize your entire trip schedule
- 🔍 **Smart Search**: Integrated with Google Places API for location search
- 🎨 **Modern UI**: Clean and responsive design with Tailwind CSS
- 🔐 **User Authentication**: Secure user accounts and data

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (v14 or higher)

## Required API Keys

You'll need to obtain the following API keys and credentials:

1. **Google Places API**
   - Required for location search functionality
   - Get it from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Places API and Maps JavaScript API

2. **SerpAPI** (for flight search)
   - Sign up at [SerpAPI](https://serpapi.com/)
   - Get your API key from the dashboard
   - Used to fetch real-time flight data from Google Flights

## Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/travel_planner"

# Authentication (if using NextAuth.js)
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google Places API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# SerpAPI
SERPAPI_API_KEY="your-serpapi-key"
```

## Database Setup

1. Create a PostgreSQL database:
```bash
createdb travel_planner
```

2. Run the database migrations:
```bash
npx prisma migrate dev
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/travel-planner.git
cd travel-planner
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
travel-planner/
├── src/
│   ├── app/                 # Next.js app router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and shared logic
│   └── types/              # TypeScript type definitions
├── prisma/                  # Database schema and migrations
├── public/                  # Static files
└── ...
```

## Technologies Used

- [Next.js 14](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Prisma](https://www.prisma.io/) - Database ORM
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [SerpAPI](https://serpapi.com/) - Flight search
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service/overview) - Location search

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
