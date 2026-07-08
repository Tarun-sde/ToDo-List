import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '@/components/Layout';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import TaskDetailPage from '@/features/tasks/TaskDetailPage';
import ProjectsPage from '@/features/projects/ProjectsPage';
import KanbanBoard from '@/features/projects/KanbanBoard';
import CalendarPage from '@/features/calendar/CalendarPage';
import AnalyticsPage from '@/features/analytics/AnalyticsPage';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [{
      element: <Layout />,
      children: [
        { path: '/', element: <Navigate to="/dashboard" replace /> },
        { path: '/dashboard', element: <DashboardPage /> },
        { path: '/tasks/:id', element: <TaskDetailPage /> },
        { path: '/projects', element: <ProjectsPage /> },
        { path: '/projects/:id', element: <KanbanBoard /> },
        { path: '/calendar', element: <CalendarPage /> },
        { path: '/analytics', element: <AnalyticsPage /> },
      ],
    }],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
