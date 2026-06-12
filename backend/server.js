const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

const connectDB = require('./config/db');

// Always load .env from the backend folder regardless of CWD
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Fail fast if MongoDB is unavailable (avoid hanging requests)
mongoose.set('bufferCommands', false);

const app = express();

// Informative warning if AI chat is not configured
if (!process.env.OPENAI_API_KEY) {
  console.warn('[warn] OPENAI_API_KEY is not set. /api/chat will return an error until configured.');
}

// Apply essential middleware for security, logging, and parsing
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser clients (no Origin header)
      if (!origin) return callback(null, true);

      const envOrigin = process.env.FRONTEND_URL;
      // Automatically allow the www. variant of the configured origin
      let wwwVariant;
      if (envOrigin) {
        const url = new URL(envOrigin);
        if (url.hostname.startsWith('www.')) {
          wwwVariant = envOrigin.replace('www.', '');
        } else {
          wwwVariant = envOrigin.replace('://', '://www.');
        }
      }
      const allowList = new Set(
        [
          envOrigin,
          wwwVariant,
          'http://localhost:5173',
          'http://127.0.0.1:5173',
          'http://localhost:3000',
          'http://127.0.0.1:3000',
        ].filter(Boolean)
      );

      // Allow any localhost/127.0.0.1 port during development
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost || allowList.has(origin)) return callback(null, true);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// Allow large JSON and Form payloads (multiple base64 images from dashboard)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true })); // <-- Added this for full coverage

// Optional request logging via morgan
const shouldLogRequests = (process.env.LOG_REQUESTS || 'false').toLowerCase() === 'true';
if (shouldLogRequests) {
  app.use(morgan('dev'));
}

// Mount API routes here
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Public routes
const applicationRoutes = require('./routes/applications');
app.use('/api/applications', applicationRoutes);

const courseRoutes = require('./routes/courses');
app.use('/api/courses', courseRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);
const staffRoutes = require('./routes/staff');
app.use('/api/staff', staffRoutes);
const noticeRoutes = require('./routes/notices');
app.use('/api/notices', noticeRoutes);
const messageRoutes = require('./routes/messages');
app.use('/api/messages', messageRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

const trainingProgramRoutes = require('./routes/trainingPrograms');
app.use('/api/training-programs', trainingProgramRoutes);

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;

  let dbStatus = 'disconnected';
  if (dbState === 1) dbStatus = 'connected';
  else if (dbState === 2) dbStatus = 'connecting';
  else if (dbState === 3) dbStatus = 'disconnecting';

  res.status(200).json({
    status: 'ok',
    service: 'IAAC API',
    db: dbStatus,
  });
});

// SEO: Dynamic sitemap that includes database-driven course/session URLs
app.get('/api/sitemap.xml', async (req, res) => {
  const SITE_URL = process.env.FRONTEND_URL || 'https://iaacasia.com';

  // Static pages
  const staticPages = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/about', changefreq: 'monthly', priority: '0.9' },
    { loc: '/programs', changefreq: 'weekly', priority: '0.9' },
    { loc: '/programs/courses', changefreq: 'weekly', priority: '0.8' },
    { loc: '/programs/practical-trainings', changefreq: 'weekly', priority: '0.8' },
    { loc: '/academic-staff', changefreq: 'monthly', priority: '0.7' },
    { loc: '/student-life', changefreq: 'monthly', priority: '0.7' },
    { loc: '/career-support', changefreq: 'monthly', priority: '0.8' },
    { loc: '/contact-us', changefreq: 'monthly', priority: '0.8' },
    { loc: '/apply-now', changefreq: 'monthly', priority: '0.9' },
    { loc: '/events/upcoming', changefreq: 'weekly', priority: '0.7' },
  ];

  // Dynamic course pages from database
  let dynamicPages = [];
  try {
    const Course = require('./models/Course');
    const courses = await Course.find({}, '_id courseType').lean();
    dynamicPages = courses.map((c) => ({
      loc: `/programs/course/${c._id}`,
      changefreq: 'weekly',
      priority: '0.6',
    }));

    const TrainingProgram = require('./models/TrainingProgram');
    const trainings = await TrainingProgram.find({}, '_id').lean();
    const trainingPages = trainings.map((t) => ({
      loc: `/programs/session/${t._id}`,
      changefreq: 'weekly',
      priority: '0.6',
    }));
    dynamicPages = [...dynamicPages, ...trainingPages];
  } catch (_) {
    // DB may not be connected; serve static pages only
  }

  const allPages = [...staticPages, ...dynamicPages];
  const urls = allPages
    .map(
      (p) =>
        `  <url>\n    <loc>${SITE_URL}${p.loc}</loc>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
  } catch (err) {
    console.error('MongoDB not connected; API will run with limited functionality');
  }

  const server = app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Stop the other process or set PORT to a different value.`);
      process.exit(1);
    }
    console.error('Server error:', err);
    process.exit(1);
  });
};

startServer();

module.exports = app;