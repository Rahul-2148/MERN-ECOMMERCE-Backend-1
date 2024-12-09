import express, { RequestHandler } from 'express';
import { getBarCharts, getDashboardStats, getLineCharts, getPieCharts } from '../controller/stats.js';
import { adminOnly } from '../middlewares/auth.js';

const app = express.Router();

// AdminDashboard Stats - Route - /api/v1/dashboard/stats
app.get("/stats", adminOnly as RequestHandler, getDashboardStats as RequestHandler);

// AdminDashboard PieChart - Route - /api/v1/dashboard/pie
app.get("/pie", adminOnly as RequestHandler, getPieCharts as RequestHandler);

// AdminDashboard bar - Route - /api/v1/dashboard/bar
app.get("/bar", adminOnly as RequestHandler, getBarCharts as RequestHandler);

// AdminDashboard lineChart - Route - /api/v1/dashboard/line
app.get("/line", adminOnly as RequestHandler, getLineCharts as RequestHandler);

export default app;