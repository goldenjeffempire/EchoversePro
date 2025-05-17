import { users, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { schema } from './db/schema';
import { desc } from "drizzle-orm";

// Define the storage interface with CRUD methods
export interface IStorage {
  toggleFollow(userId: number, followerId: number): Promise<void>;
  getUserProfile(userId: number): Promise<any>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User>;
  getFeedPosts(): Promise<any>;
  createPost({ content, visibility, attachedImage, authorId }: { content: string, visibility: string, attachedImage?: string, authorId: number }): Promise<any>;
  togglePostLike(postId: string, userId: number): Promise<void>;
  createComment({ postId, content, authorId }: { postId: string, content: string, authorId: number }): Promise<any>;
}

// Implement database storage using Drizzle ORM
export class DatabaseStorage implements IStorage {
  async toggleFollow(userId: number, followerId: number): Promise<void> {
    const isFollowing = await db
      .select()
      .from(schema.follows)
      .where(and(
        eq(schema.follows.followerId, followerId),
        eq(schema.follows.followingId, userId)
      ))
      .limit(1);

    if (isFollowing.length > 0) {
      await db.delete(schema.follows)
        .where(eq(schema.follows.id, isFollowing[0].id));
    } else {
      await db.insert(schema.follows)
        .values({ followerId, followingId: userId });
    }
  }

  async getUserProfile(userId: number): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const posts = await db.select()
      .from(schema.posts)
      .where(eq(schema.posts.authorId, userId))
      .orderBy(desc(schema.posts.createdAt))
      .limit(10);

    const followers = await db.select()
      .from(schema.follows)
      .where(eq(schema.follows.followingId, userId));

    const following = await db.select()
      .from(schema.follows)
      .where(eq(schema.follows.followerId, userId));

    return {
      ...user,
      posts,
      followerCount: followers.length,
      followingCount: following.length
    };
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        displayName: insertUser.displayName || null,
        avatar: insertUser.avatar || null,
        currentRole: insertUser.currentRole || 'general',
        subscriptionPlan: 'free',
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        aiCredits: 100
      })
      .returning();
    return user;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string }): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: stripeInfo.stripeCustomerId,
        stripeSubscriptionId: stripeInfo.stripeSubscriptionId
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getFeedPosts() {
    const result = await db.select()
      .from(schema.posts)
      .orderBy(desc(schema.posts.createdAt))
      .limit(20);
    return result;
  }

  async createPost({ content, visibility, attachedImage, authorId }: { 
    content: string, 
    visibility: string, 
    attachedImage?: string,
    authorId: number 
  }) {
    const post = await db.insert(schema.posts)
      .values({ content, visibility, attachedImage, authorId })
      .returning();
    return post[0];
  }

  async togglePostLike(postId: string, userId: number) {
    const existingLike = await db.select()
      .from(schema.likes)
      .where(and(
        eq(schema.likes.postId, parseInt(postId)),
        eq(schema.likes.userId, userId)
      ))
      .limit(1);

    if (existingLike.length > 0) {
      await db.delete(schema.likes)
        .where(eq(schema.likes.id, existingLike[0].id));
      await db.update(schema.posts)
        .set({ likes: sql`likes - 1` })
        .where(eq(schema.posts.id, parseInt(postId)));
    } else {
      await db.insert(schema.likes)
        .values({ postId: parseInt(postId), userId });
      await db.update(schema.posts)
        .set({ likes: sql`likes + 1` })
        .where(eq(schema.posts.id, parseInt(postId)));
    }
  }

  async createComment({ postId, content, authorId }: {
    postId: string,
    content: string,
    authorId: number
  }) {
    const comment = await db.insert(schema.comments)
      .values({ 
        postId: parseInt(postId), 
        content, 
        authorId 
      })
      .returning();
    return comment[0];
  }
}

// Export an instance of the database storage
export const storage = new DatabaseStorage();