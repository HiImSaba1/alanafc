import "server-only";
import nodemailer from "nodemailer";
import { academyMailConfiguration } from "./configuration";

export function createAcademyMailTransport() {
  const configuration = academyMailConfiguration();
  const transporter = nodemailer.createTransport({
    host: configuration.host,
    port: configuration.port,
    secure: configuration.secure,
    auth: { user: configuration.user, pass: configuration.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return { configuration, transporter };
}
