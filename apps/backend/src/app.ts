import "dotenv/config";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import { uploadBuffer } from "./lib/supabase.ts";
import pkg from 'express-openid-connect';
const { auth, requiresAuth } = pkg;
import cors from 'cors';
import { EmployeeRepository } from "./EmployeeRepository.ts";
import { ContentRepository } from "./ContentRepository.ts";
import { ServiceRequestRepository } from "./ServiceRequestRepository.ts";
import { prisma } from "db";

const employeeRepo = new EmployeeRepository();
const contentRepo = new ContentRepository();
const serviceRequestRepo = new ServiceRequestRepository();

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));

// Auth0 configuration
const config = {
  authRequired: false,      // Allow public routes
  auth0Logout: true,        // Use Auth0 logout endpoint
  secret: process.env.SECRET,
  baseURL: process.env.BASE_URL,
  clientID: process.env.CLIENT_ID,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
  routes: {
    login: false,
    logout: false
  },
} as const;

// Apply the auth middleware
app.use(auth(config));

// Middleware
app.use(express.json());
app.use(morgan("dev"));

const upload = multer();

app.get("/", (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/login', (req, res) => {
  res.oidc.login({
    returnTo: 'http://localhost:5173/documents',
  });
});

app.get('/logout', (req, res) => {
  res.oidc.logout({
    returnTo: 'http://localhost:5173/',
  });
});

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;

        if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }

        const data = await uploadBuffer(
            file.buffer,
            file.originalname,
            file.mimetype
        );

        res.json({
            success: true,
            path: data.path,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        });
    }
});

app.get("/employees", requiresAuth(), async (req, res) => {
    const employees = await employeeRepo.getAll();
    res.json(employees);
});

app.get("/employee/:id/:flag", async (req, res) => {
    const id = Number(req.params.id);
    const employee = await employeeRepo.getById(id);
    if (employee) {
        console.log(`[${employee.id}] ${employee.firstName} ${employee.lastName} | ${employee.jobPosition} | DOB: ${employee.dateOfBirth.toDateString()}`);
    }

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>${employee?.firstName} ${employee?.lastName}</h1>
            <p>${employee?.jobPosition}</p>
            <p>${employee?.dateOfBirth.toDateString()}</p>
          </body>
        </html>
      `);
    } else {
        res.json(employee);
    }
});

app.get("/content", requiresAuth(), async (req, res) => {
    const employee = await getEmployeeFromRequest(req);
    const jobPosition = employee?.jobPosition;

    const contents = jobPosition === 'Admin'
        ? await contentRepo.getAll()
        : await contentRepo.getByJobPosition(jobPosition ?? '');

    res.json(contents);
});

app.get("/servicereqs/:flag", async (req, res) => {
    const requests = await serviceRequestRepo.getAll();

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>Service Request</h1>
            <script>
              const data = ${JSON.stringify(requests)};
              console.log("=== SERVICE REQUESTS ===", data);
            </script>
          </body>
        </html>
      `);
    } else {
        res.json(requests);
    }
});

app.get("/assigned/:flag", async (req, res) => {
    const assigned = await serviceRequestRepo.getAllWithDetails();

    const flag = Number(req.params.flag);
    if (flag == 1) {
        res.send(`
        <html>
          <body>
            <h1>Assigned Requests</h1>
            <script>
              const data = ${JSON.stringify(assigned)};
              console.log("=== ASSIGNED ===", data);
            </script>
          </body>
        </html>
      `);
    } else {
        res.json(assigned);
    }
});

app.get('/api/me', async (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  let employee = await getEmployeeFromRequest(req);
    const sub = req.oidc.user!.sub;
    const email = req.oidc.user!.email;

    employee = await prisma.employee.update({
        where: { email },
        data: { auth0Id: sub },
    });
  res.json(employee);
});

app.post('/api/me/link', requiresAuth(), async (req, res) => {
  const sub = req.oidc.user!.sub as string;
  const email = req.oidc.user!.email as string;
  const employee = await employeeRepo.linkAuth0(email, sub);
  res.json(employee);
});

async function getEmployeeFromRequest(req: express.Request) {
  if (!req.oidc.isAuthenticated()) return null;
  const sub = req.oidc.user!.sub as string;
  return employeeRepo.getByAuth0Id(sub);
}

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;