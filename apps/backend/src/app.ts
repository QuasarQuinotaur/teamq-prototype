process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
});

import "dotenv/config";

import express from "express";
import morgan from "morgan";
import multer from "multer";
import { uploadBuffer, getSignedUrl, downloadBuffer } from "./lib/supabase.ts";
import WordExtractor from "word-extractor";
import pkg from 'express-openid-connect';
const { auth, requiresAuth } = pkg;
import cors from 'cors';
import { EmployeeRepository } from "./EmployeeRepository.ts";
import { ContentRepository } from "./ContentRepository.ts";
import { ServiceRequestRepository } from "./ServiceRequestRepository.ts";
import { prisma } from "db";
import fs from "fs";
import { exec } from "child_process";
import * as cheerio from "cheerio";

const employeeRepo = new EmployeeRepository();
const contentRepo = new ContentRepository();
const serviceRequestRepo = new ServiceRequestRepository();

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
        logout: false,
        callback: '/api/callback'
    },
} as const;

// Apply the auth middleware
app.use(auth(config));

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use("/tmp", express.static("tmp"));

const upload = multer();

app.get("/api", (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

app.get('/api/login', (req, res) => {
    res.oidc.login({
        returnTo: `${process.env.FRONTEND_URL}/documents`,
    });
});

app.get('/api/logout', (req, res) => {
    res.oidc.logout({
        returnTo: process.env.FRONTEND_URL,
    });
});

// Upload route
app.post("/api/upload", requiresAuth(), upload.single("file"), async (req, res) => {
    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const {
            name,
            link,
            jobPosition,
            expirationDate,
            contentType,
            status,
        } = req.body;

        if (!name?.trim() || !jobPosition?.trim() || !expirationDate || !contentType?.trim() || !status?.trim()) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const hasFile = !!req.file;
        const hasLink = !!link?.trim();

        if (!hasFile && !hasLink) {
            res.status(400).json({ error: "Provide either a file or an external link." });
            return;
        }

        if (hasFile && hasLink) {
            res.status(400).json({ error: "Provide only one: file or external link." });
            return;
        }

        let finalLink = "";

        if (req.file) {
            const uploaded = await uploadBuffer(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );

            finalLink = uploaded.path;
        } else {
            finalLink = link.trim();
        }

        const created = await prisma.content.create({
            data: {
                title: name,
                link: finalLink,
                ownerName: `${employee.firstName} ${employee.lastName}`,
                ownerId: employee.id,
                jobPosition,
                contentType,
                status,
                expirationDate: new Date(expirationDate),
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            content: created,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        });
    }
});

app.put("/api/upload/:id", requiresAuth(), upload.single("file"), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }

    try {
        const employee = await getEmployeeFromRequest(req);

        if (!employee) {
            res.status(404).json({ error: "No linked employee account found" });
            return;
        }

        const {
            name,
            link,
            jobPosition,
            expirationDate,
            contentType,
            status,
        } = req.body;

        if (!name?.trim() || !jobPosition?.trim() || !expirationDate || !contentType?.trim() || !status?.trim()) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const hasFile = !!req.file;
        const hasLink = !!link?.trim();

        if (!hasFile && !hasLink) {
            res.status(400).json({ error: "Provide either a file or an external link." });
            return;
        }

        if (hasFile && hasLink) {
            res.status(400).json({ error: "Provide only one: file or external link." });
            return;
        }

        let finalLink = "";

        if (req.file) {
            const uploaded = await uploadBuffer(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );

            finalLink = uploaded.path;
        } else {
            finalLink = link.trim();
        }

        const created = await prisma.content.update({
            where: { id: id },
            data: {
                title: name,
                link: finalLink,
                ownerName: `${employee.firstName} ${employee.lastName}`,
                ownerId: employee.id,
                jobPosition,
                contentType,
                status,
                expirationDate: new Date(expirationDate),
            },
            include: {
                owner: true,
            },
        });

        res.json({
            success: true,
            content: created,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err instanceof Error ? err.message : "Upload failed",
        });
    }
});


app.put("/api/upload/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    const { firstName, lastName, email, dateOfBirth, jobPosition } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !dateOfBirth || !jobPosition?.trim()) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    try {
        const employee = await employeeRepo.update(id, {
            firstName,
            lastName,
            email,
            dateOfBirth: new Date(dateOfBirth),
            jobPosition,
        });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

app.get("/api/employees", requiresAuth(), async (req, res) => {
    const employees = await employeeRepo.getAll();
    res.json(employees);
});

app.get("/api/employee/:id/:flag", async (req, res) => {
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

app.get("/api/content/:id/download", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const content = await contentRepo.getById(id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const signedUrl = await getSignedUrl(content.link);
        res.json({ url: signedUrl });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Failed to generate download URL" });
    }
});

app.get("/api/content/:id/text", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        const content = await contentRepo.getById(id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const buffer = await downloadBuffer(content.link);
        const extractor = new WordExtractor();
        const doc = await extractor.extract(buffer);
        res.json({ text: doc.getBody() });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Extraction failed" });
    }
});


// PDF PREVIEW GENERATION
app.get("/api/content/:id/thumbnail", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);

    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }

    try {
        const content = await contentRepo.getById(id);
        if (!content) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        const signedUrl = await getSignedUrl(content.link);

        const cleanUrl = signedUrl.split("?")[0];
        const ext = cleanUrl.split(".").pop()?.toLowerCase();

        // If already an image → just return it
        if (["png", "jpg", "jpeg", "webp"].includes(ext || "")) {
            res.json({ thumbnailUrl: signedUrl });
            return;
        }

        // If DOCX → convert to PDF → generate thumbnail
        if (ext === "docx") {

            // define where files will live temporarily
            const tempDocx = `./tmp/file-${id}.docx`;
            const tempPdf = `./tmp/file-${id}.pdf`;
            const outputBase = `./tmp/thumb-${id}`;

            // download file
            const response = await fetch(signedUrl);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(tempDocx, Buffer.from(buffer));

            // convert DOCX → PDF
            exec(
                // uses LibreOffice to convert docx to pdf
                `soffice --headless --convert-to pdf --outdir ./tmp ${tempDocx}`,
                (err) => {
                    if (err) {
                        console.error("DOCX → PDF failed", err);
                        res.json({ thumbnailUrl: null });
                        return;
                    }

                    // now convert PDF → PNG (reuses existing logic for PDF thumbnails)
                    exec(
                        `pdftoppm -png -f 1 -singlefile ${tempPdf} ${outputBase}`,
                        (err2) => {
                            if (err2) {
                                console.error("PDF → PNG failed", err2);
                                res.json({ thumbnailUrl: null });
                                return;
                            }

                            res.json({
                                thumbnailUrl: `/tmp/thumb-${id}.png`,
                            });
                        }
                    );
                }
            );

            return;
        }

        // If PDF → generate thumbnail
        if (ext === "pdf") {
            const tempPdf = `./tmp/file-${id}.pdf`;
            const outputBase = `./tmp/thumb-${id}`;

            // download file
            const response = await fetch(signedUrl);
            const buffer = await response.arrayBuffer();
            fs.writeFileSync(tempPdf, Buffer.from(buffer));

            exec(
                `pdftoppm -png -f 1 -singlefile ${tempPdf} ${outputBase}`,
                (err) => {
                    if (err) {
                        console.error(err);
                        res.json({ thumbnailUrl: null });
                        return;
                    }

                    res.json({
                        thumbnailUrl: `/tmp/thumb-${id}.png`,
                    });
                }
            );

            return;
        }

        // DOCX / others → no preview (for now)
        res.json({ thumbnailUrl: null });

    } catch (err) {
        res.status(500).json({
            error: err instanceof Error ? err.message : "Thumbnail failed"
        });
    }
});

// LINK PREVIEW GENERATION
app.get("/api/link-preview", async (req, res) => {
    const { url } = req.query;

    if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Missing url" });
    }

    try {
        const response = await fetch(url); // goes to url, downloads the page
        const html = await response.text(); // converts the response into raw HTML

        const $ = cheerio.load(html); // loads html in cheerio so we can query it

        // extract the best title
        const title =
            $('meta[property="og:title"]').attr("content") ||
            $("title").text();

        // extract description
        const description =
            $('meta[property="og:description"]').attr("content") || "";

        // extract image
        const image =
            $('meta[property="og:image"]').attr("content") || null;

        // send data to front end
        res.json({ title, description, image });
    } catch (err) {
        console.error("OG fetch failed", err);
        res.status(500).json({ error: "Failed to fetch preview" });
    }
});


app.get("/api/content", requiresAuth(), async (req, res) => {
    const employee = await getEmployeeFromRequest(req);
    const jobPosition = employee?.jobPosition;

    const contents = jobPosition === 'admin'
        ? await contentRepo.getAll()
        : await contentRepo.getByJobPosition(jobPosition ?? '');

    res.json(contents);
});

app.get("/api/servicereqs/:flag", async (req, res) => {
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

app.get("/api/assigned/:flag", async (req, res) => {
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

app.post("/api/employees", requiresAuth(), async (req, res) => {
    const { firstName, lastName, email, dateOfBirth, jobPosition } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !dateOfBirth || !jobPosition?.trim()) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    try {
        const employee = await employeeRepo.create({
            firstName,
            lastName,
            email,
            dateOfBirth: new Date(dateOfBirth),
            jobPosition,
        });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Create failed" });
    }
});

app.put("/api/employees/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    const { firstName, lastName, email, dateOfBirth, jobPosition } = req.body;
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !dateOfBirth || !jobPosition?.trim()) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }
    try {
        const employee = await employeeRepo.update(id, {
            firstName,
            lastName,
            email,
            dateOfBirth: new Date(dateOfBirth),
            jobPosition,
        });
        res.json(employee);
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Update failed" });
    }
});

app.delete("/api/employees/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        await employeeRepo.delete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Delete failed" });
    }
});

app.delete("/api/content/:id", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    try {
        await contentRepo.delete(id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Delete failed" });
    }
});

app.patch("/api/content/:id/status", requiresAuth(), async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: "Invalid id" });
        return;
    }
    const { status } = req.body;
    if (!status || typeof status !== "string") {
        res.status(400).json({ error: "Missing or invalid status" });
        return;
    }
    try {
        const updated = await contentRepo.update(id, { status });
        res.json({ success: true, content: updated });
    } catch (err) {
        res.status(500).json({ error: err instanceof Error ? err.message : "Status update failed" });
    }
});

app.get('/api/me', async (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const sub = req.oidc.user!.sub;
  const email = req.oidc.user!.email;

  const existing = await prisma.employee.findUnique({ where: { email } });
  if (!existing) {
    return res.status(404).json({ error: 'Employee not registered' });
  }

  const employee = await prisma.employee.update({
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
    console.log(`Server running`);
});

export default app;