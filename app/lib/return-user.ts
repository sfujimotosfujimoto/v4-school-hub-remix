import type { PrismaUser } from "~/types"

// used in session.server.ts
//-------------------------------------------
// LOCAL FUNCTIONS
//-------------------------------------------

export function returnUser(user: PrismaUser) {
  const {
    id,
    last,
    first,
    email,
    picture,
    activated,
    createdAt,
    updatedAt,
    role,
  } = user

  if (!user.credential)
    return {
      id,
      last,
      first,
      email,
      picture,
      activated,
      createdAt,
      updatedAt,
      role,
      credential: null,
      stats: user.stats || null,
    }
  if (!user.stats)
    return {
      id,
      last,
      first,
      email,
      picture,
      activated,
      createdAt,
      updatedAt,
      role,
      credential:
        {
          accessToken: user.credential.accessToken,
          expiry: Number(user.credential.expiry),
          refreshToken: user.credential.refreshToken,
          refreshTokenExpiry: Number(user.credential.refreshTokenExpiry),
          createdAt: user.credential.createdAt,
        } || null,
      stats: null,
    }

  const {
    accessToken,
    expiry,
    refreshToken,
    createdAt: credCreatedAt,
  } = user.credential
  const { count, lastVisited } = user.stats
  return {
    id,
    last,
    first,
    email,
    picture,
    activated,
    createdAt,
    updatedAt,
    role,
    credential: {
      accessToken,
      expiry: Number(expiry),
      refreshToken,
      refreshTokenExpiry: Number(user.credential.refreshTokenExpiry),
      createdAt: credCreatedAt,
    },
    stats: {
      count,
      lastVisited,
    },
  }
}
