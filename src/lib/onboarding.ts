import { eq } from "drizzle-orm"
import { createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"

import { db } from "@/db"
import { onboardingProgress, organizations } from "@/db/schema"
import { auth } from "@/lib/auth"

type OnboardingState =
  | "unauthenticated"
  | "needs-name"
  | "needs-organization"
  | "done"

export type OnboardingSnapshot = {
  state: OnboardingState
  userName: string
  organizationName: string | null
}

async function readOnboardingSnapshot(headers: HeadersInit) {
  const session = await auth.api.getSession({ headers })

  if (!session) {
    return {
      state: "unauthenticated",
      userName: "",
      organizationName: null,
    } satisfies OnboardingSnapshot
  }

  const progress = await db.query.onboardingProgress.findFirst({
    where: eq(onboardingProgress.userId, session.user.id),
    with: {
      organization: true,
    },
  })

  const userName = session.user.name.trim()

  if (progress?.completedAt && progress.organizationId) {
    return {
      state: "done",
      userName,
      organizationName: progress.organization?.name ?? null,
    } satisfies OnboardingSnapshot
  }

  if (!progress?.nameCompletedAt || !userName) {
    return {
      state: "needs-name",
      userName,
      organizationName: null,
    } satisfies OnboardingSnapshot
  }

  return {
    state: "needs-organization",
    userName,
    organizationName: progress.organization?.name ?? null,
  } satisfies OnboardingSnapshot
}

export const getOnboardingSnapshot = createServerFn({ method: "GET" }).handler(
  async () => {
    return readOnboardingSnapshot(getRequestHeaders())
  }
)

export const markNameStepComplete = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => input)
  .handler(async () => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })

    if (!session) {
      throw new Error("UNAUTHENTICATED")
    }

    const trimmedName = session.user.name.trim()

    if (!trimmedName) {
      throw new Error("INVALID_NAME")
    }

    const existingProgress = await db.query.onboardingProgress.findFirst({
      where: eq(onboardingProgress.userId, session.user.id),
    })

    if (existingProgress) {
      await db
        .update(onboardingProgress)
        .set({
          nameCompletedAt: existingProgress.nameCompletedAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onboardingProgress.userId, session.user.id))

      return { ok: true as const }
    }

    await db.insert(onboardingProgress).values({
      userId: session.user.id,
      nameCompletedAt: new Date(),
    })

    return { ok: true as const }
  })

export const completeOnboarding = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => {
    const organizationName =
      typeof input === "object" &&
      input !== null &&
      "organizationName" in input &&
      typeof input.organizationName === "string"
        ? input.organizationName.trim()
        : ""

    return { organizationName }
  })
  .handler(async ({ data }) => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() })

    if (!session) {
      throw new Error("UNAUTHENTICATED")
    }

    const userName = session.user.name.trim()

    if (!userName) {
      throw new Error("NAME_REQUIRED")
    }

    if (!data.organizationName) {
      throw new Error("INVALID_ORGANIZATION")
    }

    const result = await db.transaction(async (tx) => {
      const existingProgress = await tx.query.onboardingProgress.findFirst({
        where: eq(onboardingProgress.userId, session.user.id),
      })

      if (existingProgress?.completedAt && existingProgress.organizationId) {
        const existingOrganization = await tx.query.organizations.findFirst({
          where: eq(organizations.id, existingProgress.organizationId),
        })

        return {
          organizationId: existingProgress.organizationId,
          organizationName: existingOrganization?.name ?? data.organizationName,
        }
      }

      const insertedOrganization = await tx
        .insert(organizations)
        .values({
          name: data.organizationName,
          ownerUserId: session.user.id,
        })
        .onConflictDoNothing()
        .returning({
          id: organizations.id,
          name: organizations.name,
        })

      let organization: { id: string; name: string } | undefined =
        insertedOrganization[0]

      if (insertedOrganization.length === 0) {
        organization = await tx.query.organizations.findFirst({
          where: eq(organizations.ownerUserId, session.user.id),
        })
      }

      if (!organization) {
        throw new Error("ORGANIZATION_CREATE_FAILED")
      }

      const now = new Date()

      if (existingProgress) {
        await tx
          .update(onboardingProgress)
          .set({
            nameCompletedAt: existingProgress.nameCompletedAt ?? now,
            organizationId: organization.id,
            completedAt: now,
            updatedAt: now,
          })
          .where(eq(onboardingProgress.userId, session.user.id))
      } else {
        await tx.insert(onboardingProgress).values({
          userId: session.user.id,
          nameCompletedAt: now,
          organizationId: organization.id,
          completedAt: now,
        })
      }

      return {
        organizationId: organization.id,
        organizationName: organization.name,
      }
    })

    return {
      redirectTo: "/app",
      organizationId: result.organizationId,
      organizationName: result.organizationName,
    }
  })
