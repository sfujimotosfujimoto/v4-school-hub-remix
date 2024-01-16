import type { User } from "~/types"

// used in session.server.ts
//-------------------------------------------
// LOCAL FUNCTIONS
//-------------------------------------------

export function returnUser(user: User) {
  return {
    ...user,
    credential: user.credential,
    stats: user.stats,
  }
}

// export function returnUser(user: User) {
//   if (!user.credential)
//     return {
//       ...user,
//       credential: null,
//       stats: user.stats || null,
//     }

//   if (!user.stats)
//     return {
//       ...user,
//       credential: user.credential,
//       // {
//       //   accessToken: user.credential.accessToken,
//       //   expiry: user.credential.expiry,
//       //   refreshToken: user.credential.refreshToken,
//       //   refreshTokenExpiry: user.credential.refreshTokenExpiry,
//       //   createdAt: user.credential.createdAt,
//       // } || null,
//       stats: null,
//     }

//   // const {
//   //   accessToken,
//   //   expiry,
//   //   refreshToken,
//   //   createdAt: credCreatedAt,
//   // } = user.credential
//   // const { count, lastVisited } = user.stats
//   return {
//     ...user,
//     credential: user.credential,
//     //  {
//     //   accessToken,
//     //   expiry,
//     //   refreshToken,
//     //   refreshTokenExpiry: user.credential.refreshTokenExpiry,
//     //   createdAt: credCreatedAt,
//     // },
//     stats: user.stats,
//     // {
//     //   count,
//     //   lastVisited,
//     // },
//   }
// }
