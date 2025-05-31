import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create sample users
  const user1 = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: await Bun.password.hash("password123"),
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane@example.com",
      password: await Bun.password.hash("password123"),
      avatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    },
  });

  console.log("👥 Created users:", { user1: user1.email, user2: user2.email });

  // Create sample markers
  const markers = [
    {
      title: "Golden Gate",
      description: "Famous golden gate location with beautiful architecture",
      latitude: 50.4501,
      longitude: 30.5234,
      address: "Golden Gate, Kyiv, Ukraine",
      imageUrl:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      userId: user1.id,
    },
    {
      title: "Palace of Sports",
      description:
        "Sports complex and entertainment venue in the heart of the city",
      latitude: 50.4485,
      longitude: 30.52,
      address: "Palace of Sports, Kyiv, Ukraine",
      imageUrl:
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      userId: user1.id,
    },
    {
      title: "Olympic Centre",
      description: "Modern sports facility with world-class amenities",
      latitude: 50.447,
      longitude: 30.518,
      address: "Olympic Centre, Kyiv, Ukraine",
      imageUrl:
        "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400&h=300&fit=crop",
      userId: user2.id,
    },
    {
      title: "St. Nicholas Cathedral",
      description: "Historic cathedral with stunning architectural details",
      latitude: 50.444,
      longitude: 30.515,
      address: "St. Nicholas Cathedral, Kyiv, Ukraine",
      imageUrl:
        "https://images.unsplash.com/photo-1520637836862-4d197d17c90a?w=400&h=300&fit=crop",
      userId: user2.id,
    },
    {
      title: "Point of Invincibility",
      description: "Memorial site dedicated to the heroes of Ukraine",
      latitude: 50.452,
      longitude: 30.528,
      address: "Point of Invincibility, Kyiv, Ukraine",
      imageUrl:
        "https://images.unsplash.com/photo-1597149203649-9fbeb58d8696?w=400&h=300&fit=crop",
      userId: user1.id,
    },
  ];

  for (const markerData of markers) {
    const marker = await prisma.marker.create({
      data: markerData,
    });
    console.log(`📍 Created marker: ${marker.title}`);
  }

  console.log("✅ Database seed completed successfully!");
  console.log("\n📋 Sample credentials:");
  console.log("Email: john@example.com | Password: password123");
  console.log("Email: jane@example.com | Password: password123");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
