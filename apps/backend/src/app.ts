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
import { EmployeeRepository } from "./EmployeeRepository.ts";\
import contentRoutes from "./routes/content.ts";
import serviceRequestsRouter from "./routes/serviceRequests.ts";
import authRouter from "./routes/auth.ts";
import photoRoutes from "./routes/photos.ts";

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

// HERE ARE THE ROUTES YOU HAVE TO ADD
app.use("/api/content", contentRoutes);
app.use('/api/servicereqs', serviceRequestsRouter);
app.use('/api/photos', photoRoutes);
app.use('/api', authRouter);

export async function getEmployeeFromRequest(req: express.Request) {
    if (!req.oidc.isAuthenticated()) return null;
    const sub = req.oidc.user!.sub as string;
    return employeeRepo.getByAuth0Id(sub);
}

// Start server
app.listen(port, () => {
    console.log(`Server running`);
});

export default app;