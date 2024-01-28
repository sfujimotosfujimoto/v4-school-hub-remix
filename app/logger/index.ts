import pino from "pino"

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
    },
  },
})

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
