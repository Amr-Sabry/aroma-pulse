// Core Types for Aroma Pulse

export type Role = "admin" | "producer" | "head" | "creative";

export type TaskStatus = "To Do" | "In Progress" | "Completed" | "On Hold";
export type WorkState = "play" | "pause" | "meeting";
export type ProjectHealth = "Good" | "Risk" | "Critical";
export type ProjectStatus = "Active" | "Completed" | "On Hold";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "online" | "busy" | "offline";
  avatar?: string;
}

export interface TeamMember extends User {
  skills: string[];
  software: string[];
  capacityHours: number;
  bookedHours: number;
  availableHours: number;
  metrics: MemberMetrics;
  activeTaskId: string | null;
  nextFreeSlot: string;
}

export interface MemberMetrics {
  speed: number;
  quality: number;
  creativity: number;
  reliability: number;
  teamwork: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  budgetHours: number;
  deadline: string;
  status: ProjectStatus;
  health: ProjectHealth;
  milestones: Milestone[];
  createdAt?: string;
}

export interface Milestone {
  title: string;
  date: number;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  type: string;
  assignees: string[];
  producer: string;
  status: TaskStatus;
  workState: WorkState;
  estHours: number;
  actualHours: number;
  startTime: string | null;
  deadline: string;
  deadlineTime: string;
  startDay: number;
  duration: number;
  risk: "low" | "medium" | "high";
  note: string;
  deliverables: Deliverable[];
  requiredSkills: string[];
  requiredSoftware: string[];
  extensions: Extension[];
  weekendHandling: WeekendHandling;
  dailyStartTime: string;
  dailyEndTime: string;
}

export interface Deliverable {
  type: string;
  count: number;
  specs: string;
}

export interface Extension {
  id: number;
  reason: string;
  hours: number;
  date: string;
  timestamp: string;
}

export type WeekendHandling =
  | "exclude_both"
  | "include_both"
  | "exclude_fri"
  | "exclude_sat";

// Studio Stats
export interface StudioStats {
  totalCapacity: number;
  totalBooked: number;
  totalAvailable: number;
  totalRevisions: number;
  totalSavings: number;
}

// Firestore paths
export const FIRESTORE_PATHS = {
  team: "aroma-pulse/production/team",
  projects: "aroma-pulse/production/projects",
  tasks: "aroma-pulse/production/tasks",
  users: "aroma-pulse/production/users",
} as const;
