import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users } from "lucide-react";

type DepartmentCardProps = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  doctorCount: number;
};

export function DepartmentCard({
  id,
  name,
  description,
  location,
  doctorCount,
}: DepartmentCardProps) {
  return (
    <Link href={`/departments/${id}`} className="cursor-pointer">
      <Card className="transition-all duration-200 hover:border-primary hover:shadow-md cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-lg text-cyan-900">
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {description && (
            <p className="line-clamp-2 text-sm text-slate-600">{description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {doctorCount} 位医生
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
