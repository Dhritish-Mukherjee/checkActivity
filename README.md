# Strivers Task - Internal Task & Time Tracking Platform

A full-stack MERN application for internal task management and time tracking built for Strivers edtech platform.

## 📋 Overview

Strivers Task is an internal task management and time-tracking tool with two user roles:
- **Admin**: Create/assign tasks, view analytics dashboard, manage employees
- **Employee**: View assigned tasks, log time (manual or timer), update task status

The application is designed to be deployed independently at `task.strivers.co.in`.

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- React Router
- Axios
- Chart.js + react-chartjs-2
- Tailwind CSS
- React Context API (state management)

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs (password hashing)
- CORS middleware

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (running locally or connection string)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Dhritish-Mukherjee/checkActivity.git
cd checkActivity
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env with your MongoDB URI and JWT secret
# MONGODB_URI=mongodb://your-connection-string
# JWT_SECRET=your-secret-key

# Seed the database (creates admin + sample data)
npm run seed

# Start development server
npm run dev
# Server runs on http://localhost:5000
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install

# Create .env file for API URL
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### Default Credentials
- **Admin**: admin@strivers.co.in / admin123
- **Employee**: rahul@strivers.co.in / employee123

## 📁 Project Structure

```
strivers-task/
├── backend/
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth & role validation
│   ├── config/          # Database configuration
│   ├── server.js        # Express app entry point
│   ├── seed.js          # Database seeder
│   └── package.json
└── frontend/
├── public/
├── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context (Auth)
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── App.jsx          # Main app with routing
│   └── main.jsx         # Entry point
├── index.html
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

## 🔑 Key Features

### Authentication
- JWT-based secure authentication
- Role-based access control (Admin/Employee)
- Protected routes on frontend
- Token refresh handling

### Task Management (Admin)
- Create, edit, delete tasks
- Assign tasks to multiple employees
- Set priority, due dates, descriptions
- Filter tasks by status, assignee, priority
- Bulk operations support

### Time Tracking (Employee)
- **Manual Entry**: Input hours/minutes with date and optional note
- **Timer Widget**: Start/stop/pause live timer with automatic duration calculation
- View personal time logs with filtering
- Time entries categorized as "manual" or "timer"

### Dashboard (Admin)
- Summary statistics cards:
  - Total tasks, completed this week
  - Total hours logged, active employees
- Interactive charts:
  - Hours logged per employee (bar chart)
  - Task status breakdown (doughnut chart)
  - Time trend over last 7 days (line chart)
  - Tasks completed per employee (bar chart)

### Employee Interface
- Personal task list with status filtering
- Task detail view with status updates
- Time logging controls (manual + timer)
- Personal time log history

## 🎨 Design & UI

- Clean, professional Tailwind CSS design
- Responsive layout (works on desktop & tablet)
- Role-based sidebar navigation
- Loading states, empty states, and visual feedback
- Consistent color scheme suitable for internal tools
- Accessible form controls and interactions

## 🔐 Security

- JWT authentication with HTTP-only cookie considerations
- Passwords hashed with bcrypt (cost factor 10)
- Role-based route protection
- Input validation on both frontend and backend
- CORS configured for frontend domain
- Environment variables for sensitive data

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Admin-create employee accounts
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/employees` - Get all employees (admin only)

### Tasks
- `GET /api/tasks` - Get all tasks (admin only)
- `GET /api/tasks/my` - Get assigned tasks (employee)
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create task (admin only)
- `PUT /api/tasks/:id` - Update task (admin only)
- `PATCH /api/tasks/:id/status` - Update task status
- `DELETE /api/tasks/:id` - Delete task (admin only)

### Time Logs
- `GET /api/timelogs/my` - Get user's time logs
- `GET /api/timelogs/task/:taskId` - Get task's time logs
- `GET /api/timelogs/all` - Get all time logs (admin only)
- `POST /api/timelogs/manual` - Create manual time entry
- `POST /api/timelogs/timer/start` - Start timer
- `PATCH /api/timelogs/timer/:id/stop` - Stop timer

### Dashboard (Admin Only)
- `GET /api/dashboard/statistics` - Summary stats
- `GET /api/dashboard/hours-per-employee` - Chart data
- `GET /api/dashboard/task-status` - Status breakdown
- `GET /api/dashboard/time-trend` - Time series data
- `GET /api/dashboard/tasks-completed` - Per-employee tasks
- `GET /api/dashboard/employees-summary` - Employee stats

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop monitors (≥1024px)
- Tablets and iPads (768-1024px)
- Mobile devices are supported but primarily designed for desktop/tablet use

## 🚀 Deployment

### Backend
- Deploy Node.js service to any hosting platform (Heroku, AWS, DigitalOcean, etc.)
- Set environment variables:
  - `MONGODB_URI`: MongoDB connection string
  - `JWT_SECRET`: Secret key for JWT signing
  - `PORT`: Server port (default: 5000)
  - `NODE_ENV`: development/production
  - `CORS_ORIGIN`: Frontend URL for CORS

### Frontend
- Build static assets: `npm run build`
- Deploy built files to any static hosting (Netflix, Vercel, S3, etc.)
- Set `VITE_API_URL` environment variable to backend URL

### Recommended Setup
- Backend: `task.strivers.co.in` API service
- Frontend: Served via CDN/nginx at same domain
- Database: MongoDB Atlas or self-hosted
- SSL: Enable HTTPS in production

## 🧪 Testing

### Manual Testing Steps
1. Register admin account via seed script or API
2. Login as admin
3. Create employees via Admin → Employees → Add Employee
4. Create tasks via Admin → Tasks → New Task
5. Assign tasks to employees
6. Login as employee
7. View assigned tasks in My Tasks
8. Start/stop timer on tasks
9. Log manual time entries
10. Return to admin dashboard to view analytics

### API Testing
- Use Postman or curl to test endpoints
- All endpoints return JSON responses
- Error handling with appropriate HTTP status codes
- Validation errors return 400 with message details

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

Please ensure code follows existing patterns and includes appropriate tests.

## 📝 License

Internal use only for Strivers edtech platform.

## 👥 Acknowledgements

- Built with ❤️ for Strivers internal team
- Inspired by modern task management best practices
- Utilizes open-source libraries: React, Express, MongoDB, Tailwind CSS

---
**Note**: Replace placeholder values in `.env` files with actual secrets before deployment.
**Admin credentials**: admin@strivers.co.in / admin123 (created by seed script)
**Employee credentials**: rahul@strivers.co.in / employee123 (created by seed script)