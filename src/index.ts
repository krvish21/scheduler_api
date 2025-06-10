import express from 'express';
import cors from 'cors';
import { emailRouter } from './routes/emailRoutes.js';
import { SchedulerService } from './services/schedulerService.js';

const app = express();
const port = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
    'https://scheduler-fe-silk.vercel.app',
    'http://localhost:5173',  // For local development
    'http://localhost:3000'   // For local development
];

app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

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