import { db } from "./db";
import type { InsertUserProject, UserProject, InsertProfile, Profile } from "@shared/schema";
import { userProjects, profiles } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  // User Projects
  getUserProjects(userId: string): Promise<UserProject[]>;
  getUserProject(id: string): Promise<UserProject | null>;
  createUserProject(project: InsertUserProject): Promise<UserProject>;
  updateUserProject(id: string, project: Partial<UserProject>): Promise<UserProject | null>;
  deleteUserProject(id: string): Promise<void>;

  // Profiles
  getProfile(userId: string): Promise<Profile | null>;
  createProfile(profile: InsertProfile): Promise<Profile>;
  updateProfile(userId: string, profile: Partial<Profile>): Promise<Profile | null>;
}

class MemStorage implements IStorage {
  private projects: Map<string, UserProject> = new Map();
  private profilesMap: Map<string, Profile> = new Map();

  async getUserProjects(userId: string): Promise<UserProject[]> {
    return Array.from(this.projects.values()).filter((p) => p.userId === userId);
  }

  async getUserProject(id: string): Promise<UserProject | null> {
    return this.projects.get(id) || null;
  }

  async createUserProject(project: InsertUserProject): Promise<UserProject> {
    const id = crypto.randomUUID();
    const newProject: UserProject = {
      ...project,
      id,
      createdAt: new Date(),
      updatedAt: null,
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateUserProject(id: string, updates: Partial<UserProject>): Promise<UserProject | null> {
    const project = this.projects.get(id);
    if (!project) return null;
    
    const updated = { ...project, ...updates, updatedAt: new Date() };
    this.projects.set(id, updated);
    return updated;
  }

  async deleteUserProject(id: string): Promise<void> {
    this.projects.delete(id);
  }

  async getProfile(userId: string): Promise<Profile | null> {
    return this.profilesMap.get(userId) || null;
  }

  async createProfile(profile: InsertProfile): Promise<Profile> {
    const newProfile: Profile = {
      ...profile,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.profilesMap.set(profile.userId, newProfile);
    return newProfile;
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    const profile = this.profilesMap.get(userId);
    if (!profile) return null;
    
    const updated = { ...profile, ...updates, updatedAt: new Date() };
    this.profilesMap.set(userId, updated);
    return updated;
  }
}

export const storage: IStorage = new MemStorage();
