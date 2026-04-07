import "dotenv/config";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import { uploadBuffer } from "./lib/supabase.ts";
import { prisma } from "db";

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(morgan("dev"));

const upload = multer();

app.get("/", (_req, res) => {
    res.sendStatus(200);
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

app.get("/employees", async (req, res) => {
    const employees = await prisma.employee.findMany({ orderBy: { id: "asc" } });
    res.json(employees)
});


app.get("/employee/:id/:flag", async (req, res) => {
    const id = Number(req.params.id);
    const employee = await prisma.employee.findUnique({
        where: { id }
    });
    if(employee) {
        console.log(`[${employee.id}] ${employee.firstName} ${employee.lastName} | ${employee.jobPosition} | DOB: ${employee.dateOfBirth.toDateString()}`);
    }

    const flag = Number(req.params.flag);
    if (flag == 1){
        res.send(`
        <html>
          <body>
            <h1>${employee?.firstName} ${employee?.lastName}</h1>
            <p>${employee?.jobPosition}</p>
            <p>${employee?.dateOfBirth.toDateString()}</p>
          </body>
        </html>
      `);
    }
    else res.json(employee)
});

app.get("/content", async (req, res) => {
    const contents = await prisma.content.findMany({ orderBy: { id: "asc" }, include: { owner: true } });
    res.json(contents);
});

app.get("/servicereqs/:flag", async (req, res) => {
    const requests = await prisma.serviceRequest.findMany({ orderBy: { id: "asc" } });

    console.log("=== SERVICE REQUESTS ===");
    requests.forEach((reqst) => {
        console.log(`[${reqst.id}] Type: ${reqst.type} | CreatorID: ${reqst.creatorID} | RequesteeID: ${reqst.requesteeID}`);
    });

    const flag = Number(req.params.flag);
    if (flag == 1){
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
    }
   else res.json(requests);
});

app.get("/assigned/:flag", async (req, res) => {
    const assigned = await prisma.serviceRequest.findMany({
        include: {
            creator: true,
            requestee: true
        }
    });

    console.log("=== ASSIGNED REQUESTS ===");
    assigned.forEach((ar) => {
        console.log(`[${ar.id}] Type: ${ar.type} | Creator: ${ar.creator.firstName} ${ar.creator.lastName} | Requestee: ${ar.requestee.firstName} ${ar.requestee.lastName}`);
    });

    const flag = Number(req.params.flag);
    if (flag == 1){
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
    }
    else res.json(assigned);
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

export default app;