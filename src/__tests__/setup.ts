import { db } from "../lib/db";
import { beforeEach, afterAll} from 'bun:test'
// Clean up database before each test
beforeEach(async () => {
  // Delete all data in the correct order to avoid foreign key constraints
  await db.session.deleteMany();
  await db.marker.deleteMany();
  await db.user.deleteMany();
});

// Close database connection after all tests
afterAll(async () => {
  await db.$disconnect();
});
