<div align="center">
  <div style="position: relative; width: 100%; max-width: 1200px; margin: 0 auto;">
    <img src="./assets/vinnova.png" alt="Vinnova Competition Platform" style="width: 100%; height: auto; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%); border-radius: 15px; display: flex; align-items: center; justify-content: center;">
      <h1 style="color: white; font-size: 4rem; font-weight: 900; text-align: center; margin: 0; text-shadow: 2px 2px 8px rgba(0,0,0,0.7); font-family: 'Segoe UI', Arial, sans-serif;">
        Vinnova Competition Platform
      </h1>
    </div>
  </div>
</div>

<br/>

# Vinnova Competition Platform

Welcome to the **Vinnova Competition Platform**! This is a comprehensive solution for managing competitive events, team formations, and participant enrollments. Built with modern technologies, it provides features for both competitors and organizers to create, manage, and participate in various competitions.

## Table of Contents
* [Features](#features)
* [Tech Stack](#tech-stack)
* [Prerequisites](#prerequisites)
* [Getting Started](#getting-started)
* [Configuration](#configuration)
  * [Environment Variables](#environment-variables)
  * [Supabase Database](#supabase-database)
  * [Google Services](#google-services)
  * [AI Integration](#ai-integration)
* [Project Structure](#project-structure)
* [Executing the Application](#executing-the-application)
* [API Endpoints](#api-endpoints)

## Features

### Competition Management
- **Competition Creation & Management**
  - Create and manage competitive events
  - Set competition rules, deadlines, and requirements
  - Track competition progress and status
  - Support for multiple competition types

- **Custom Landing Page Builder**
  - **GrapesJS Studio Integration**: Drag-and-drop visual editor
  - **Dynamic Content**: Auto-populate competition details
  - **Asset Management**: Upload and manage images, icons, and media
  - **Publishing System**: One-click page deployment

### Team Collaboration
- **Team Formation & Management**
  - Create and join teams
  - Team member invitation system
  - Role-based team hierarchy (Leader/Member)
  - Team profile and information management

### User Roles & Authentication
- **Multi-Role System**
  - **Competitors**: Participate in competitions, form teams
  - **Organizers**: Create and manage competitions
  - Secure authentication with Supabase Auth
  - Profile management and user verification

### Enrollment & Registration
- **Competition Registration**
  - Team-based enrollment system
  - Registration status tracking
  - Automated enrollment management
  - Competition capacity control

### AI-Powered Features
- **Intelligent Chatbot**
  - Google Gemini AI integration
  - Competition guidance and support
  - Real-time assistance for users

### Communication & Notifications
- **Email Integration**
  - Gmail API integration for notifications
  - Competition updates and announcements

### Dashboard & Analytics
- **Comprehensive Dashboards**
  - Role-specific dashboard views
  - Competition analytics and insights
  - Team performance tracking
  - User activity monitoring

## Tech Stack

### Frontend
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **Framer Motion** for animations
- **Editor.js** for rich content editing
- **GrapesJS Studio** for visual page building

### Backend
- **Ballerina** runtime and services
- **PostgreSQL** database via Supabase
- **RESTful API** architecture
- **JWT Authentication** with interceptors

### External Services
- **Supabase** (Database, Auth, Storage)
- **Google Gemini AI** for chatbot
- **Gmail API** for email services
- **Google OAuth** for authentication

## Prerequisites

### Backend Requirements
- **Ballerina** 2201.12.7 or higher
- **Java 21** (for PostgreSQL driver)
- **PostgreSQL** database (via Supabase)
- **Google Cloud Platform** account with:
  - Gmail API enabled
  - Google Gemini AI API access
  - OAuth 2.0 configured
- **Supabase** account and project

### Frontend Requirements
- **Node.js** 18.x or higher
- **npm** 9.x or higher
- Modern web browser with JavaScript enabled
- **Next.js** 15.x

### Development Tools
- IDE with TypeScript support (VS Code recommended)
- Git for version control
- API testing tool (Postman recommended)

## Getting Started

To get started with this project, clone the repository and install the necessary dependencies for both the client and server.

```bash
git clone https://github.com/TumashaD/iwb-tetra.git
cd iwb-tetra
```

## Configuration

### Environment Variables

#### Backend Configuration
The backend configuration is managed through the `Config.toml` file located in the Server directory. Here is a sample configuration:

```toml
# Supabase Configuration
supabaseJwtSecret = "your-supabase-jwt-secret"
supabaseUrl = "https://your-project.supabase.co/auth/v1"
supabaseStorageUrl = "https://your-project.storage.supabase.co/storage/v1"
supabaseAnonKey = "your-supabase-anon-key"

# Server Configuration
serverPort = 8080

# Database Configuration (Supabase PostgreSQL)
dbHost = "db.your-project.supabase.co"
dbPort = 5432
dbName = "postgres"
dbUser = "postgres"
dbPassword = "your-database-password"

# Google Gemini AI Configuration
geminiApiKey = "your-gemini-api-key"

# Gmail API Configuration
refreshToken = "your-gmail-refresh-token"
clientId = "your-google-client-id"
clientSecret = "your-google-client-secret"
```

#### Frontend Configuration
The frontend configuration is managed through environment variables. Create a `.env.local` file in the Client directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

### Supabase Database
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up the required database tables for:
   - Users and profiles
   - Competitions
   - Teams and team members
   - Enrollments
3. Configure Row Level Security (RLS) policies
4. Get your project URL and anon key from the Supabase dashboard

### Google Services

#### Gmail API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Gmail API
4. Create OAuth 2.0 credentials
5. Configure OAuth consent screen
6. Generate refresh token for server-to-server communication

#### Google Gemini AI Setup
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Create an API key for Gemini
3. Configure the API key in your Config.toml

### AI Integration
The platform integrates with Google Gemini AI for:
- Intelligent chatbot assistance
- Competition guidance
- Real-time user support

## Project Structure

```
iwb-tetra/
├── Client/                          # Next.js Frontend Application
│   ├── src/
│   │   ├── app/                     # App Router pages
│   │   │   ├── auth/                # Authentication pages
│   │   │   ├── competitions/        # Competition listing and details
│   │   │   ├── dashboard/           # User dashboards
│   │   │   │   ├── competitor/      # Competitor dashboard
│   │   │   │   └── organizer/       # Organizer dashboard
│   │   │   └── settings/            # User settings
│   │   ├── components/              # Reusable UI components
│   │   │   ├── auth/                # Authentication components
│   │   │   ├── editor/              # Rich text editor
│   │   │   └── ui/                  # Base UI components
│   │   ├── contexts/                # React contexts
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utility libraries
│   │   ├── services/                # API service layers
│   │   └── types/                   # TypeScript type definitions
│   ├── public/                      # Static assets
│   └── package.json                 # Frontend dependencies
├── Server/                          # Ballerina Backend Application
│   ├── modules/
│   │   ├── auth/                    # Authentication services
│   │   ├── services/                # Business logic services
│   │   │   ├── aiService.bal        # AI chatbot service
│   │   │   ├── competitionService.bal # Competition management
│   │   │   ├── enrollmentService.bal  # Registration management
│   │   │   ├── gmailService.bal     # Email services
│   │   │   ├── organizerService.bal # Organizer-specific services
│   │   │   ├── teamService.bal      # Team management
│   │   │   └── userService.bal      # User management
│   │   └── supabase/                # Database and storage utilities
│   ├── main.bal                     # Main server entry point
│   ├── Ballerina.toml               # Project configuration
│   └── Config.toml                  # Environment configuration
└── README.md                        # Project documentation
```

## Executing the Application

### Backend (Ballerina Server)
Navigate to the Server directory and run the Ballerina application:

```bash
cd Server
bal run
```

The server will start on the configured port (default: 8080) and expose the following services:
- Competition Service: `/competitions`
- User Service: `/users`
- Team Service: `/teams`
- Enrollment Service: `/enrollments`
- AI Service: `/ai`
- Gmail Service: `/gmail`
- Organizer Service: `/organizer`

### Frontend (Next.js Application)
Navigate to the Client directory and run the development server:

```bash
cd Client
npm install
npm run dev
```

The frontend application will be available at `http://localhost:3000`


## API Endpoints

### Competition Management
- `GET /competitions` - List all competitions
- `GET /competitions/{id}` - Get competition details
- `POST /competitions` - Create new competition (Organizers only)
- `PUT /competitions/{id}` - Update competition (Organizers only)
- `DELETE /competitions/{id}` - Delete competition (Organizers only)

### Team Management
- `GET /teams` - List teams
- `GET /teams/{id}` - Get team details with members
- `POST /teams` - Create new team
- `POST /teams/{id}/members` - Add team member
- `DELETE /teams/{id}/members/{memberId}` - Remove team member
- `DELETE /teams/{id}` - Delete team

### Enrollment Management
- `GET /enrollments` - List enrollments
- `POST /enrollments` - Register team for competition
- `PUT /enrollments/{id}` - Update enrollment status
- `DELETE /enrollments/{id}` - Cancel enrollment

### User Management
- `GET /users/{id}` - Get user profile
- `PUT /users/{id}` - Update user profile
- `GET /users/search` - Search users by email

### AI Services
- `POST /ai/chat` - Send message to AI chatbot
- `GET /ai/conversation/{id}` - Get conversation history

### Organizer Services
- `POST /organizer/saveLandingPage/{id}` - Save landing page project data
- `POST /organizer/publishLandingPage/{id}` - Publish custom landing page
- `POST /organizer/uploadAssets/{id}` - Upload assets for competition
- `DELETE /organizer/deleteAssets/{id}` - Delete competition assets
- `GET /organizer/getAssets/{id}` - Get competition assets

### Email Services
- `POST /gmail/send` - Send email notifications
- `POST /gmail/bulk` - Send bulk emails to teams

## Custom Landing Page Builder

The platform features a powerful **visual webpage builder** that allows organizers to create professional, custom landing pages for their competitions using **GrapesJS Studio**.

### Key Features

#### Visual Editor
- **Drag-and-Drop Interface**: Intuitive visual editor with real-time preview
- **Professional Components**: Pre-built sections for competition details, timelines, and contact information
- **Responsive Design**: Automatically optimized for desktop, tablet, and mobile devices
- **WYSIWYG Editing**: See exactly how your page will look while editing

#### Dynamic Content Integration
- **Auto-Population**: Competition details (title, dates, category, prizes) are automatically integrated
- **Template Variables**: Use dynamic placeholders that update with competition data
- **Live Data Binding**: Changes to competition settings reflect immediately on the landing page

#### Asset Management
- **Media Upload**: Upload and manage images, icons, and other assets
- **Asset Library**: Organized storage for competition-specific media files
- **Optimized Delivery**: Assets served via Supabase Storage for fast loading

#### Advanced Customization
- **Custom CSS**: Full styling control with CSS editor
- **Component Library**: Flex layouts, accordions, and specialized competition components
- **Template System**: Start with professional templates or build from scratch

### How It Works

1. **Create Competition**: Organizers create a new competition with basic details
2. **Access Editor**: Navigate to the competition edit page to open the visual editor
3. **Design Page**: Use drag-and-drop tools to design the perfect landing page
4. **Add Content**: Competition data is automatically populated into the design
5. **Upload Assets**: Add custom images, logos, and media files
6. **Preview & Test**: Real-time preview shows how the page will appear
7. **Publish**: One-click deployment makes the page live for participants

### Technical Implementation

- **Frontend**: React-based GrapesJS Studio SDK integration
- **Backend**: Ballerina services for saving, loading, and publishing pages
- **Storage**: Supabase for HTML/CSS storage and asset management
- **Rendering**: Server-side HTML generation for optimal performance

### Example Use Cases

- **Hackathon Landing Pages**: Showcase event details, schedules, and prizes
- **Competition Portals**: Dedicated pages for specific competitions
- **Event Promotion**: Marketing-focused pages to attract participants
- **Information Hubs**: Comprehensive competition guides and resources

## Key Features Walkthrough

### For Competitors
1. **Registration & Authentication**
   - Sign up with email verification
   - Secure login with Supabase Auth
   - Profile management and customization

2. **Team Management**
   - Create teams with custom names and member limits
   - Invite team members via email search
   - Manage team roles (Leader/Member)
   - View team statistics and activity

3. **Competition Participation**
   - Browse available competitions
   - Register teams for competitions
   - Track enrollment status
   - Receive updates and notifications

4. **Dashboard & Analytics**
   - Personal competition history
   - Team performance metrics
   - Upcoming competition schedules

### For Organizers
1. **Competition Creation & Landing Pages**
   - **Visual Page Builder**: Create stunning custom competition webpages using GrapesJS Studio
   - **Drag-and-Drop Editor**: Professional visual editor with real-time preview
   - **Pre-built Templates**: Competition-focused layouts and components
   - **Asset Management**: Upload and organize images, icons, and media files

2. **Competition Management**
   - Create detailed competition descriptions
   - Set rules, deadlines, and requirements
   - Configure registration parameters
   - Manage competition lifecycle and status

3. **Team Management**
   - View all registered teams
   - Approve, reject and manage registrations
   - Send bulk communications
   - Track participation metrics

4. **Communication Tools**
   - Send targeted emails to participants
   - Broadcast announcements
   - Individual team communication

## Technology Highlights

- **Modern Frontend Stack**: Next.js 15 with React 19 and TypeScript
- **Visual Page Builder**: GrapesJS Studio for professional webpage creation
- **Robust Backend**: Ballerina with PostgreSQL and REST APIs
- **Real-time Features**: Live updates and notifications
- **AI Integration**: Google Gemini for intelligent assistance
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Security**: JWT authentication with role-based access control
- **Cloud Storage**: Supabase for database, authentication, and file storage

## Development Roadmap

- [ ] Advanecd submission management
- [ ] Real-time chat system
- [ ] Competition analytics dashboard
- [ ] Mobile application
- [ ] Advanced AI features for competition recommendations
- [ ] Payment integration for premium competitions and rewards


**Vinnova Competition Platform** - Empowering competitive collaboration through modern technology.
