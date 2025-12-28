import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Your App</h1>
          <p className="mt-4 text-sm text-gray-600">
            Your project is ready. Start building your application!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
