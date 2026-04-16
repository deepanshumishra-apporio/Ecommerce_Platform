import type { WebhookEvent } from "@clerk/express/webhooks";
import { clerkClient } from "@clerk/express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/app-error.js";

type ClerkWebhookData = {
  id?: string;
  primary_email_address_id?: string;
  email_addresses?: Array<{ id?: string; email_address?: string }>;
};

type ClerkUserData = {
  id: string;
  primaryEmailAddressId?: string | null;
  emailAddresses: Array<{ id: string; emailAddress: string }>;
};

const userInclude = {
  cart: {
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  },
  wishlist: {
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  },
  addresses: true,
} as const;

const extractPrimaryEmail = (data: ClerkWebhookData) => {
  const addresses = data.email_addresses ?? [];
  if (data.primary_email_address_id) {
    const primary = addresses.find((a) => a.id === data.primary_email_address_id);
    if (primary?.email_address) {
      return primary.email_address;
    }
  }
  return addresses[0]?.email_address ?? "";
};

const extractPrimaryEmailFromClerkUser = (user: ClerkUserData) => {
  if (user.primaryEmailAddressId) {
    const primary = user.emailAddresses.find((address) => address.id === user.primaryEmailAddressId);
    if (primary?.emailAddress) {
      return primary.emailAddress;
    }
  }

  return user.emailAddresses[0]?.emailAddress ?? "";
};

const resolveRoleForNewUser = async () => {
  const existingUsers = await prisma.user.count();
  return existingUsers === 0 ? "ADMIN" : "USER";
};

export const handleClerkWebhook = async (event: WebhookEvent) => {
  const data = event.data as ClerkWebhookData;
  const clerkId = data.id;

  if (!clerkId) {
    throw new AppError("Invalid Clerk webhook payload", 400);
  }

  if (event.type === "user.deleted") {
    await prisma.user.deleteMany({
      where: { clerkId },
    });

    return { processed: true };
  }

  if (event.type !== "user.created" && event.type !== "user.updated") {
    return { processed: true, skipped: event.type };
  }

  const email = extractPrimaryEmail(data);

  if (!email) {
    throw new AppError("Clerk user email is required", 400);
  }

  const role = await resolveRoleForNewUser();

  return prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: {
      clerkId,
      email,
      role,
    },
  });
};

export const getCurrentDbUser = async (clerkId: string) => {
  const existing = await prisma.user.findUnique({
    where: { clerkId },
    include: userInclude,
  });

  if (existing) {
    return existing;
  }

  const clerkUser = (await clerkClient.users.getUser(clerkId)) as ClerkUserData;
  const email = extractPrimaryEmailFromClerkUser(clerkUser);

  if (!email) {
    throw new AppError("Unable to resolve current user email", 400);
  }

  const role = await resolveRoleForNewUser();

  return prisma.user.upsert({
    where: { clerkId },
    update: {
      email,
    },
    create: {
      clerkId,
      email,
      role,
    },
    include: userInclude,
  });
};
