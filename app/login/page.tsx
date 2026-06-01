import { Metadata } from "next";
import LoginForm from "@/components/forms/login-form";

export const metadata: Metadata = {
  title: "Login | Mueblería ERP",
  description: "Acceso al sistema de gestión de Mueblería",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Mueblería Cuotas
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center text-xs text-zinc-500">
          &copy; {new Date().getFullYear()} Antigravity ERP System
        </div>
      </div>
    </div>
  );
}
