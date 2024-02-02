import pino from "pino"
import pretty from "pino-pretty"

const stream = pretty({
  levelFirst: true,
  colorize: true,
  ignore: "hostname,pid",
})

export const logger = pino(
  {
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
  },
  stream,
)
