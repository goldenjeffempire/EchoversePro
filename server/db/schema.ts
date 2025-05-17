
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum('user_role', ['work', 'personal', 'school', 'general']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['free', 'basic', 'pro', 'family', 'student', 'enterprise']);
export const projectStatusEnum = pgEnum('project_status', ['on_track', 'at_risk', 'delayed', 'completed']);
export const taskPriorityEnum = pgEnum('task_priority', ['high', 'medium', 'normal', 'low']);

export const schema = {
  users: pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull().unique(),
    displayName: text("display_name"),
    avatar: text("avatar"),
    currentRole: userRoleEnum("current_role").default('general'),
    subscriptionPlan: subscriptionPlanEnum("subscription_plan").default('free'),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    aiCredits: integer("ai_credits").default(100),
    createdAt: timestamp("created_at").defaultNow(),
  }),

  posts: pgTable("posts", {
    id: serial("id").primaryKey(),
    authorId: integer("author_id").notNull(),
    content: text("content").notNull(),
    attachedImage: text("attached_image"),
    visibility: text("visibility").notNull().default('public'),
    likes: integer("likes").default(0),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  }),

  comments: pgTable("comments", {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    authorId: integer("author_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  }),

  likes: pgTable("likes", {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull(),
    userId: integer("user_id").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  })
};
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export schema from shared
export * from '../../shared/schema';
