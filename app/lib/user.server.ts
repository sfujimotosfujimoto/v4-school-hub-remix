import type { User, PrismaUser } from "~/types"

import type { Role } from "@prisma/client"

import { prisma } from "./db.server"
import { returnUser } from "./returnUser"

const selectUser = {
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
  try {
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        ...selectUser,
      },
    })

    if (!user || !user.credential) {
      return null
    }

    return returnUser(user)
  } catch (error) {
    console.error(`getUserByEmail: ${error}`)
    return null
  }
}

export async function getUserById(id: number): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      ...selectUser,
    },
  })

  if (!user || !user.credential) {
    return null
  }

  return returnUser(user)
}

export async function updateUserById(
  id: number,
  data: { activated: boolean; role: Role },
): Promise<boolean> {
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
  try {
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
  } catch (error) {
    console.error(`getUsers: ${error}`)
    return null
  }
}

function returnUsers(prismaUsers: PrismaUser[]) {
  return prismaUsers.map((user) => returnUser(user))
}
