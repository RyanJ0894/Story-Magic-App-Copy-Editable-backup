import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "./db";
import { projects, userProjects, insertUserProjectSchema } from "@shared/schema";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get all projects for a user
  app.get("/api/projects", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ error: "userId is required" });
      }
      
      const allProjects = await db
        .select()
        .from(userProjects)
        .where(eq(userProjects.userId, userId));
      
      res.json(allProjects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get a single project by ID
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await db
        .select()
        .from(userProjects)
        .where(eq(userProjects.id, id))
        .limit(1);
      
      if (project.length === 0) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(project[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create a new project
  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertUserProjectSchema.parse(req.body);
      const [newProject] = await db
        .insert(userProjects)
        .values(validatedData)
        .returning();
      
      res.status(201).json(newProject);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update a project
  app.put("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [updatedProject] = await db
        .update(userProjects)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(userProjects.id, id))
        .returning();
      
      if (!updatedProject) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      res.json(updatedProject);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete a project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db
        .delete(userProjects)
        .where(eq(userProjects.id, id));
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
