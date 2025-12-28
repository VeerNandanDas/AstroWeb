import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Products Schema
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull(), // Gemstones, Bracelets, Rudraksha, Yantras, Rings, Remedies
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  images: text("images").array().notNull(),
  benefits: text("benefits").array().notNull(),
  certified: boolean("certified").default(true),
  inStock: boolean("in_stock").default(true),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("4.50"),
  reviewCount: integer("review_count").default(0),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

// Blog Posts Schema
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // Astrology, Gemstones, Spirituality, Wellness
  featuredImage: text("featured_image").notNull(),
  author: text("author").notNull(),
  readTime: integer("read_time").notNull(), // in minutes
  metaDescription: text("meta_description").notNull(),
  publishedAt: timestamp("published_at").notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
});

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

// Appointments Schema
export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  date: text("date").notNull(),
  time: text("time").notNull(),
  consultationType: text("consultation_type").notNull(), // Personal, Business, Relationship, Health
  message: text("message"),
  status: text("status").default("pending"), // pending, accepted, declined, completed
  paymentStatus: text("payment_status").default("pending"), // pending, completed, failed
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

// Testimonials Schema
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: text("location").notNull(),
  rating: integer("rating").notNull(),
  review: text("review").notNull(),
  avatar: text("avatar").notNull(),
  verified: boolean("verified").default(true),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
});

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

// Cart Schema (stored in-memory, not persisted)
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// Contact Form Schema
export interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone must be at least 10 digits"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

// Videos Schema
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  youtubeUrl: text("youtube_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

// Order Schema
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  items: text("items").notNull(), // JSON stringified cart items
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").default("pending"),
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

// Users Schema (for storing user profiles and admin status)
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  isAdmin: boolean("is_admin").default(false),
  accountType: text("account_type").default("customer"), // 'admin' or 'customer'
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export type User = typeof users.$inferSelect;

// Daily Horoscopes Schema
export const dailyHoroscopes = pgTable("daily_horoscopes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  sign: text("sign").notNull(), // aries, taurus, gemini, etc.
  love: text("love").notNull(),
  career: text("career").notNull(),
  finance: text("finance").notNull(),
  health: text("health").notNull(),
  luckyNumber: text("lucky_number"),
  luckyColor: text("lucky_color"),
  luckyTime: text("lucky_time"),
  luckyGem: text("lucky_gem"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertDailyHoroscopeSchema = createInsertSchema(dailyHoroscopes).omit({
  id: true,
  createdAt: true,
});

export type DailyHoroscope = typeof dailyHoroscopes.$inferSelect;
export type InsertDailyHoroscope = z.infer<typeof insertDailyHoroscopeSchema>;

// Monthly Muhurat (Auspicious Days) Schema
export const muhurats = pgTable("muhurats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: text("month").notNull(), // e.g., "2024-09" for September 2024
  year: integer("year").notNull(),
  monthName: text("month_name").notNull(), // e.g., "September"
  vehiclePurchase: text("vehicle_purchase"), // e.g., "18 (after 10:15), 19 (Till Midnight), 21"
  miscellaneousPurchase: text("miscellaneous_purchase"), // e.g., "13, 14 (till 12:13)"
  newHome: text("new_home"), // e.g., "16 (16:39 to 18:18), 18 (After 10:15)"
  auspiciousDays: text("auspicious_days"), // e.g., "13, 14, 16, 18, 19, 21, 24, 25, 27, 29 (partial), 30"
  inauspiciousDays: text("inauspicious_days"), // e.g., "15, 17, 20, 22, 23, 26, 28, 29, 31"
  note: text("note"), // Additional notes
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertMuhuratSchema = createInsertSchema(muhurats).omit({
  id: true,
  createdAt: true,
});

export type Muhurat = typeof muhurats.$inferSelect;
export type InsertMuhurat = z.infer<typeof insertMuhuratSchema>;

// Zodiac Signs
export interface ZodiacSign {
  name: string;
  slug: string;
  symbol: string;
  element: string;
  dates: string;
  traits: string[];
  compatibility: string[];
  luckyStone: string;
}
