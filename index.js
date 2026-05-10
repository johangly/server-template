import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import logger from "./utils/logger.js";
import { verifyToken } from './middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';
import db from "./database/index.js";
import roleRoutes from "./routes/role.routes.js";
import userRoutes from "./routes/users.routes.js";
import permissionRoutes from "./routes/permission.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import auditConfigRoutes from "./routes/auditConfig.routes.js";
import systemConfigRoutes from "./routes/systemConfig.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from 'jsonwebtoken';
import { swaggerUi, specs } from './config/swagger.js';

const app = express();
app.set('trust proxy', 1);
const server = createServer(app);

const API_PREFIX = process.env.API_PREFIX || "/api";

// Configuración de CORS dinámica
const allowedOriginsFromEnv = (process.env.CORS_ORIGINS || '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

const allowedOrigins = allowedOriginsFromEnv.length > 0
	? allowedOriginsFromEnv
	: (process.env.NODE_ENV === 'production'
		? []
		: ['http://localhost:5173', 'http://localhost:5174']);

const corsOptions = {
	origin: (origin, callback) => {
		if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
			callback(null, true);
		} else {
			callback(new Error('Not allowed by CORS'));
		}
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	credentials: true
};

const io = new Server(server, {
	cors: corsOptions,
	path: `${API_PREFIX}/sockets`,
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'API Documentation'
}));

app.use(`${API_PREFIX}/roles`, roleRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/permissions`, permissionRoutes);
app.use(`${API_PREFIX}/audit-logs`, auditRoutes);
app.use(`${API_PREFIX}/audit-config`, auditConfigRoutes);
app.use(`${API_PREFIX}/system-config`, systemConfigRoutes);
app.use(`${API_PREFIX}/auth`, authRoutes);

// Endpoint para verificar conexión
const apiLimiter = rateLimit({
	windowMs: 1 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
});

app.get(`${API_PREFIX}/`, apiLimiter, (req, res) => {
	res.json({ message: "Bienvenido a la API" });
});

app.get('/health', (req, res) => {
	res.status(200).send('OK');
});

// Middleware de autenticación para Socket.io
io.use((socket, next) => {
	const token = socket.handshake.auth.token;
	if (!token) {
		return next(new Error('Authentication error: No token provided'));
	}
	jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
		if (err) {
			return next(new Error('Authentication error: Invalid token'));
		}
		socket.user = user;
		next();
	});
});

// WebSocket para actualizaciones en tiempo real
io.on("connection", (socket) => {
	logger.info(`Cliente autenticado conectado: ${socket.id}, Usuario: ${socket.user.email}`);

	const userId = socket.user.id;
	socket.join(`user_${userId}`);
	logger.info(`Usuario ${userId} unido a su sala privada`);

	socket.on("disconnect", () => {
		logger.info(`Cliente desconectado: ${socket.id}`);
	});

	socket.on("unir_sala", (userId) => {
		socket.join(`user_${userId}`);
		logger.info(`Usuario ${userId} unido a su sala privada`);
	});
});

// Hacer que io esté disponible en las rutas
app.set("io", io);

// Export app for testing
export default app;

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
	logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
	logger.error('Uncaught Exception:', err);
	process.exit(1);
});

// Start server (only if not in test mode)
if (process.env.NODE_ENV !== 'test') {
	const PORT = process.env.PORT || 3001;
	db.sequelize
		.authenticate()
		.then(async () => {
			await db.initialize();
			server.listen(PORT, () => {
				logger.info(`Server is running on port ${PORT}`);
			});
		})
		.catch((err) => {
			logger.error("Database connection error:", err);
		});
}
