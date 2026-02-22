import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const enableSignup = process.env.ENABLE_SIGNUP !== "false";

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Welcome back</CardTitle>
      </CardHeader>
      <CardContent>
        <LoginForm showSignupLink={enableSignup} />
      </CardContent>
    </Card>
  );
}
