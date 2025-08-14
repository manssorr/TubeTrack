import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function NotFound() {
    return (
        <div className="container mx-auto py-16">
            <div className="flex justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-6xl font-bold text-muted-foreground mb-4">404</CardTitle>
                        <CardTitle>Page Not Found</CardTitle>
                        <CardDescription>
                            The page you're looking for doesn't exist or has been moved.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button asChild>
                            <Link to="/">Go Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default NotFound;
