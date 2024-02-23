import pino from "pino"
import pretty from "pino-pretty"

const stream = pretty({
  levelFirst: true,
  colorize: true,
  ignore: "hostname,pid",
})

// export const logger = pino({
//   level: "debug",
//   crlf: true,

// })

export const logger =
  process.env.NODE_ENV === "development"
    ? pino(
        {
          level: process.env.NODE_ENV === "development" ? "debug" : "info",
        },
        stream,
      )
    : pino({
        level: "info",
      })
