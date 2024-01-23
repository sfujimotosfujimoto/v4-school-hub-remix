import type { Role } from "@prisma/client"

import { logger } from "~/logger"
import type { User } from "~/types"
import { prisma } from "./db.server"
import { returnUser } from "./return-user"

export const selectUser = {
  id: true,
  first: true,
  last: true,
  email: true,
  picture: true,
  role: true,
  activated: true,
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

export async function getUserById(
  userId: number,
): Promise<{ user: User | null; refreshUser: User | null }> {
  logger.debug(`👑 getUserById: userId: ${userId}`)

  try {
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

    if (user) {
      return { user, refreshUser: null }
    }

    const refreshUser = await prisma.user.findUnique({
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

    return { user: user || null, refreshUser: refreshUser || null }
    // return returnUser(user)
  } catch (error) {
    console.error(`getUserById: ${error}`)
    return { user: null, refreshUser: null }
  }
}

export async function getRefreshUserById(userId: number): Promise<User | null> {
  if (!userId) return null

  try {
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
  } catch (error) {
    console.error(`getRefreshUserById: ${error}`)
    return null
  }
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

  try {
    const users = await prisma.user.findMany({
      orderBy: [
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
  } catch (error) {
    console.error(`getUsers: ${error}`)
    return null
  }
}

export async function updateUser(userId: number) {
  try {
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
  } catch (error) {
    console.error(`updateUser: ${error}`)
    return null
  }
}

function returnUsers(prismaUsers: User[]) {
  return prismaUsers.map((user) => returnUser(user))
}

// // Get UserBase
// // used in `getUserBaseFromSession`
// export async function getUserByEmail(email: string): Promise<User | null> {
//   logger.debug(`👑 getUserByEmail: email: ${email}`)
//   const user: User | null = await prisma.user.findUnique({
//     where: {
//       email,
//       credential: {
//         expiry: { gt: new Date() },
//       },
//     },
//     select: {
//       ...selectUser,
//     },
//   })

//   logger.debug(
//     `✅ services/user.server.ts ~ 	🌈 user.credential.expiry ✅ ${user
//       ?.credential?.expiry} - ${new Date(
//       user?.credential?.expiry || 0,
//     ).toLocaleString()}`,
//   )

//   if (!user || !user.credential) {
//     return null
//   }

//   if (!user.stats) user.stats = null

//   return user
//   // return returnUser(user)
// }
