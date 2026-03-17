import type { Metadata } from "next";
import { ForgotPasswordClient } from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Reset Password — True Color",
  description: "Enter your email to receive a password reset link.",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordClient />;
}
