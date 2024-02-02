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
    // name: "sf-logger",
    // transport: {
    //   target: "pino-pretty",
    //   options: {
    //     colorize: true,
    //   },
    // },
  },
  stream,
)

// import winston from "winston"

// const logFormatter = winston.format.combine(
//   winston.format.timestamp({
//     format: "YY-MM-DD hh:mm:ss",
//   }),
//   winston.format.printf((meta) => {
//     const { level, message, timestamp } = meta

//     return `${timestamp} ${level}: ${message}`
//   }),
//   winston.format.colorize({
//     all: true,
//   }),
//   winston.format.align(),
// )
// export const logger = winston.createLogger({
//   level: process.env.LOG_LEVEL || "info",
//   format: logFormatter,
//   transports: [new winston.transports.Console()],
// })
