import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Clear existing data
  await prisma.session.deleteMany();
  await prisma.marker.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const password = await bcrypt.hash("password123", 10);

  const john = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
    },
  });

  const jane = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      password,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jane",
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "alice@example.com",
      password,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
    },
  });

  console.log("✅ Created 3 users");

  // Create markers
  const markers = [
    {
      title: "Golden Gate Bridge",
      description: "Iconic suspension bridge in San Francisco",
      latitude: 37.8199,
      longitude: -122.4783,
      address: "Golden Gate Bridge, San Francisco, CA 94129",
      imageUrl: "https://images.unsplash.com/photo-1558170439-4f8e7d2e3d2f",
      userId: john.id,
    },
    {
      title: "Times Square",
      description: "The bustling heart of New York City",
      latitude: 40.758,
      longitude: -73.9855,
      address: "Times Square, Manhattan, NY 10036",
      imageUrl: "https://images.unsplash.com/photo-1560807707-8cc77767d783",
      userId: john.id,
    },
    {
      title: "Eiffel Tower",
      description: "Iconic iron lattice tower in Paris",
      latitude: 48.8584,
      longitude: 2.2945,
      address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France",
      imageUrl: "https://images.unsplash.com/photo-1511739001486-6bfe10ce785f",
      userId: jane.id,
    },
    {
      title: "Big Ben",
      description: "Famous clock tower in London",
      latitude: 51.5007,
      longitude: -0.1246,
      address: "Westminster, London SW1A 0AA, UK",
      imageUrl: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383",
      userId: jane.id,
    },
    {
      title: "Sydney Opera House",
      description: "Architectural masterpiece in Sydney Harbor",
      latitude: -33.8568,
      longitude: 151.2153,
      address: "Bennelong Point, Sydney NSW 2000, Australia",
      imageUrl: "https://images.unsplash.com/photo-1523059623039-a9b2e0361cb6",
      userId: alice.id,
    },
    {
      title: "Colosseum",
      description: "Ancient amphitheatre in Rome",
      latitude: 41.8902,
      longitude: 12.4922,
      address: "Piazza del Colosseo, 1, 00184 Roma RM, Italy",
      imageUrl: "https://images.unsplash.com/photo-1552832230-c0197dd311b5",
      userId: alice.id,
    },
  ];

  for (const marker of markers) {
    await prisma.marker.create({ data: marker });
  }

  console.log("✅ Created 6 markers");

  console.log("🎉 Database seeding completed!");
  console.log("\n📝 Sample login credentials:");
  console.log("  Email: john@example.com | Password: password123");
  console.log("  Email: jane@example.com | Password: password123");
  console.log("  Email: alice@example.com | Password: password123");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
