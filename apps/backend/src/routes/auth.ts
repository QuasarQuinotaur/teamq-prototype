import { Router } from "express";
import pkg from "express-openid-connect";
const { requiresAuth } = pkg;
import { EmployeeRepository } from "../EmployeeRepository.ts";
import { prisma } from "db";

const router = Router();
const employeeRepo = new EmployeeRepository();

// GET /api
router.get("/", (req, res) => {
    res.send(req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out');
});

// GET /api/login
router.get("/login", (req, res) => {
    res.oidc.login({
        returnTo: `${process.env.FRONTEND_URL}/documents`,
    });
});

// GET /api/logout
router.get("/logout", (req, res) => {
    res.oidc.logout({
        returnTo: process.env.FRONTEND_URL,
    });
});

// GET /api/me
router.get("/me", async (req, res) => {
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

// POST /api/me/link
router.post("/me/link", requiresAuth(), async (req, res) => {
    const sub = req.oidc.user!.sub as string;
    const email = req.oidc.user!.email as string;
    const employee = await employeeRepo.linkAuth0(email, sub);
    res.json(employee);
});

export default router;
