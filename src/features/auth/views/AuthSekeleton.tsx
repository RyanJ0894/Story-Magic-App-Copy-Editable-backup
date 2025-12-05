import heroImage from "@/assets/hero-cinema.jpg";
import { Skeleton } from "@/components/ui/skeleton";

export const AuthSekeleton = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-left bg-no-repeat" style={{
            backgroundImage: `url(${heroImage})`
        }}>
            <div className="absolute inset-0 bg-gradient-to-r from-cinema-dark/90 via-cinema-dark/70 to-transparent" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
        </div>
    </div>
  )
};