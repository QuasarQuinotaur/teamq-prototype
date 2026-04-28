process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

import "dotenv/config";
import express from "express";
import morgan from "morgan";
import pkg from 'express-openid-connect';
const { auth } = pkg;
import cors from 'cors';
import { EmployeeRepository } from "./EmployeeRepository.ts";
import contentRoutes from "./routes/content.ts";
import serviceRequestsRouter from "./routes/serviceRequests.ts";
import authRouter from "./routes/auth.ts";
import photoRoutes from "./routes/photos.ts";
import employeeRouter from "./routes/employee.ts";
import favoritesRouter from "./routes/favorites.ts";
import linkPreviewRouter from "./routes/linkPreview.ts";
import tagsRouter from "./routes/tags.ts";
import notificationRoutes from "./routes/notification.ts";
import settingsRouter from "./routes/settings.ts";
import reviewRouter from "./routes/contentReview.ts"
require('./Service/ContentReviewServiceJob.ts')();

const employeeRepo = new EmployeeRepository();

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));

console.log(process.env.SECRET);
console.log(process.env.BASE_URL);
console.log(process.env.CLIENT_ID);
console.log(process.env.ISSUER_BASE_URL);

const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    routes: {
        login: false,
        logout: false,
        callback: '/api/callback'
    },
} as const;

app.use(auth(config));
app.use(express.json());
app.use(morgan("dev"));
app.use("/tmp", express.static("tmp"));

// HERE ARE THE ROUTES YOU HAVE TO ADD
app.use("/api/content", contentRoutes);
app.use("/api/employee", employeeRouter);
app.use("/api/roles", rolesRouter);
app.use('/api/servicereqs', serviceRequestsRouter);
app.use('/api/photos', photoRoutes);
app.use('/api', authRouter);
app.use('/api', linkPreviewRouter);
app.use("/api/favorites", favoritesRouter);
app.use("/api", tagsRouter);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settings", settingsRouter);
app.use("/api/reviews", reviewRouter);

export async function getEmployeeFromRequest(req: express.Request) {
    if (!req.oidc.isAuthenticated()) return null;
    const sub = req.oidc.user!.sub as string;
    return employeeRepo.getByAuth0Id(sub);
}

// Start server — generous timeouts so long routes (e.g. AI document summary) are not cut off.
const server = app.listen(port, () => {
    console.log(`Server running`);
});
const LONG_REQUEST_MS = 600_000; // 10 minutes
server.requestTimeout = LONG_REQUEST_MS;
server.headersTimeout = LONG_REQUEST_MS + 10_000;
server.setTimeout(LONG_REQUEST_MS);

export default app;