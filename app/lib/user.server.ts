import type { Role } from "@prisma/client"

import { logger } from "~/logger"
import type { User } from "~/types"
import { prisma } from "./db.server"
import { returnUser } from "./return-user"

export const selectUser = {
  id: true,
  first: true,
  last: true,
  picture: true,
  email: true,
  activated: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  credential: {
    select: {
      accessToken: true,
      expiry: true,
      refreshToken: true,
      refreshTokenExpiry: true,
      createdAt: true,
    },
  },
  stats: {
    select: {
      count: true,
      lastVisited: true,
    },
  },
}

// Get UserBase
// used in `getUserBaseFromSession`
export async function getUserByEmail(email: string): Promise<User | null> {
  logger.debug(`👑 getUserByEmail: email: ${email}`)
  const user: User | null = await prisma.user.findUnique({
    where: {
      email,
      credential: {
        expiry: { gt: new Date() },
      },
    },
    select: {
      ...selectUser,
    },
  })

  console.log(
    "✅ services/user.server.ts ~ 	🌈 user.credential.expiry ✅ ",
    user?.credential?.expiry,
    new Date(user?.credential?.expiry || 0).toLocaleString(),
  )

  if (!user || !user.credential) {
    return null
  }

  if (!user.stats) user.stats = null

  return user
  // return returnUser(user)
}
export async function getUserById(userId: number): Promise<User | null> {
  logger.debug(`👑 getUserById: userId: ${userId}`)
  const user: User | null = await prisma.user.findUnique({
    where: {
      id: userId,
      credential: {
        expiry: { gt: new Date() },
      },
    },
    select: {
      ...selectUser,
    },
  })

  if (!user || !user.credential) {
    return null
  }

  if (!user.stats) user.stats = null

  return user
  // return returnUser(user)
}

export async function getRefreshUserById(userId: number): Promise<User | null> {
  if (!userId) return null
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
      credential: {
        refreshTokenExpiry: { gt: new Date() },
      },
    },
    select: {
      ...selectUser,
    },
  })

  if (!user || !user.credential) {
    return null
  }

  if (!user.stats) user.stats = null

  return user
  // return returnUser(user)
}

export async function updateUserById(
  id: number,
  data: { activated: boolean; role: Role },
): Promise<boolean> {
  logger.debug(`✅ updateUserById: id ${id}`)
  try {
    const user = await prisma.user.update({
      where: {
        id,
      },
      data: {
        activated: data.activated,
        role: data.role,
        updatedAt: new Date(Date.now()),
      },
    })

    if (!user) {
      return false
    }

    return true
  } catch (error) {
    console.error(`updateUserById: ${error}`)
    return false
  }
}

export async function deleteUserById(id: number): Promise<boolean> {
  logger.debug(`✅ deleteUserById: id ${id}`)
  try {
    const deleteUser = await prisma.user.delete({
      where: {
        id,
      },
    })

    if (!deleteUser) {
      return false
    }

    return true
  } catch (error) {
    console.error(`deleteUserById: ${error}`)
    return false
  }
}

export async function getUsers(): Promise<User[] | null> {
  logger.debug(`✅ getUsers`)
  const users = await prisma.user.findMany({
    orderBy: [
      // {
      //   stats: {
      //     count: "desc",
      //   },
      // },
      {
        stats: {
          lastVisited: "desc",
        },
      },
      {
        updatedAt: "desc",
      },
    ],
    select: {
      ...selectUser,
    },
  })

  if (!users) {
    return null
  }

  return returnUsers(users)
}

export async function updateUser(userId: number) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      activated: true,
      stats: {
        update: {
          count: {
            increment: 1,
          },
          lastVisited: new Date(),
        },
      },
    },
  })
}

function returnUsers(prismaUsers: User[]) {
  return prismaUsers.map((user) => returnUser(user))
}
