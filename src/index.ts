import express from 'express';
import cors from 'cors';
import emailRouter from './routes/emailRoutes.js';
import { SchedulerService } from './services/schedulerService.js';

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
app.use(cors({
    origin: true, // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Add CORS headers to all responses
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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