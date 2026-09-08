"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

import { adminSignIn } from "@/auth-admin";

export async function adminLoginAction(formData: FormData) {
  try {
    await adminSignIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/admin",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/admin/login?error=1");
    }
    throw error;
  }
}
