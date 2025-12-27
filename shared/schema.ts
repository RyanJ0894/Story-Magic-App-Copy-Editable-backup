import { pgTable, text, serial, timestamp, jsonb, boolean, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z} from "zod";

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: text("title").notNull(),
  script: text("script"),
  status: text("status"),
  projectKey: text("project_key").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// User projects table
export const userProjects = pgTable("user_projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  title: text("title"),
  script: text("script"),
  aiDirectorJson: jsonb("ai_director_json"),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const insertUserProjectSchema = createInsertSchema(userProjects).omit({
  id: true,
  createdAt: true,
});
export type InsertUserProject = z.infer<typeof insertUserProjectSchema>;
export type UserProject = typeof userProjects.$inferSelect;

// Profiles table
export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey(),
  planType: text("plan_type").notNull().default("individual"),
  accountStatus: text("account_status").notNull().default("active"),
  role: text("role").notNull().default("Staff"),
  invitedBy: uuid("invited_by"),
  packageHistory: jsonb("package_history").default([]),
  upgradeDate: timestamp("upgrade_date").defaultNow(),
  availablePackages: jsonb("available_packages").default(["individual"]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;

// Voice Applications table for Voice Marketplace submissions
export const voiceApplications = pgTable("voice_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  experience: text("experience").notNull(),
  bio: text("bio"),
  audioUrls: jsonb("audio_urls").default([]),
  fileInfo: jsonb("file_info").default([]),
  status: text("status").notNull().default("pending"),
  emailSent: boolean("email_sent").default(false),
  emailError: text("email_error"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVoiceApplicationSchema = createInsertSchema(voiceApplications).omit({
  id: true,
  createdAt: true,
  status: true,
  emailSent: true,
  emailError: true,
});
export type InsertVoiceApplication = z.infer<typeof insertVoiceApplicationSchema>;
export type VoiceApplication = typeof voiceApplications.$inferSelect;

// Script Notes table for storing notes on script lines
export const scriptNotes = pgTable("script_notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  lineId: text("line_id").notNull(),
  text: text("text").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertScriptNoteSchema = createInsertSchema(scriptNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertScriptNote = z.infer<typeof insertScriptNoteSchema>;
export type ScriptNote = typeof scriptNotes.$inferSelect;
