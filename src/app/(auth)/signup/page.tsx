import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Create an account</CardTitle>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
