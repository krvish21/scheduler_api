import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import emailRouter from './routes/emailRoutes.js';
import { SchedulerService } from './services/schedulerService.js';

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: 'https://scheduler-fe-silk.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    credentials: false,
    maxAge: 86400 // 24 hours
}));

// Add CORS headers middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Access-Control-Allow-Origin', 'https://scheduler-fe-silk.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
    next();
});

app.use(express.json());

// Routes
app.use('/api/v1/task', emailRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    
    // Start the scheduler
    setInterval(() => {
        console.log('Running scheduler...');
        SchedulerService.checkAndProcessEmails();
    }, 60000); // Run every minute
}); 