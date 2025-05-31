import { PrismaClient } from "@prisma/client";
import { treaty } from "@elysiajs/eden";
import { app } from "../index";

const prisma = new PrismaClient();
const api = treaty(app);

export interface TestUser {
  id: string;
  email: string;
  name: string;
  token: string;
}

export interface TestMarker {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  description?: string;
  userId: string;
}

export async function createTestUser(
  email = "test@example.com"
): Promise<TestUser> {
  const { data, response } = await api.api.v1.auth.register.post({
    email,
    password: "password123",
    confirmPassword: "password123",
    name: "Test User",
  });

  if (400 <= response.status) {
    throw new Error(`Failed to create test user: ${response.status}`);
  }

  const { data: loginData, response: loginResponse } =
    await api.api.v1.auth.login.post({
      email,
      password: "password123",
    });

  if (400 <= loginResponse.status) {
    throw new Error(`Failed to login test user: ${loginResponse.status}`);
  }

  return {
    id: data?.user?.id ?? "",
    email: data?.user?.email ?? "",
    name: data?.user?.name ?? "",
    token: loginData?.token ?? "",
  };
}

export async function createTestMarker(user: TestUser): Promise<TestMarker> {
  const { data, response } = await api.api.v1.markers.post(
    {
      title: "Test Marker",
      latitude: 50.4501,
      longitude: 30.5234,
      description: "Test description",
    },
    {
      headers: getAuthHeader(user.token),
    }
  );

  if (400 <= response.status) {
    throw new Error(`Failed to create test marker: ${response.status}`);
  }

  return {
    id: data?.marker?.id ?? "",
    title: data?.marker?.title ?? "",
    latitude: data?.marker?.latitude ?? 0,
    longitude: data?.marker?.longitude ?? 0,
    description: data?.marker?.description ?? undefined,
    userId: data?.marker?.userId ?? "",
  };
}

export async function cleanupDatabase() {
  await Promise.all([
    prisma.session.deleteMany(),
    prisma.marker.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export function getAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}
