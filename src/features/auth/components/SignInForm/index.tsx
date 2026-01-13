import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { signInSchema, SignInSchema } from "./schema";
import { SignInFormData } from "../../auth.type";

interface SignInFormProps {
  onSubmit: (data: SignInFormData) => void;
  onForgotPassword: (email: string) => void;
  loading?: boolean;
  error?: string;
}

export function SignInForm({ onSubmit, onForgotPassword, loading = false, error }: SignInFormProps) {
  const form = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const email = form.watch("email");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-background border-border text-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  className="bg-background border-border text-foreground"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          variant="cinema"
          disabled={loading}
        >
          {loading ? "Loading..." : "Sign In"}
        </Button>

        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="link"
            onClick={() => {
              if (email && email.trim()) {
                onForgotPassword(email);
              } else {
                onForgotPassword("");
              }
            }}
            disabled={loading}
            className="text-cinema-gold hover:text-cinema-gold/80 text-sm"
          >
            {loading ? "Sending..." : "Forgot password?"}
          </Button>
        </div>
      </form>
    </Form>
  );
}