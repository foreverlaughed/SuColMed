import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Stethoscope } from "lucide-react";

type DoctorCardProps = {
  id: string;
  name: string;
  title: string;
  specialties: string[] | null;
  departmentName: string;
};

export function DoctorCard({
  id,
  name,
  title,
  specialties,
  departmentName,
}: DoctorCardProps) {
  return (
    <Link href={`/doctors/${id}`} className="cursor-pointer">
      <Card className="transition-all duration-200 hover:border-primary hover:shadow-md cursor-pointer">
        <CardHeader className="flex flex-row items-center gap-4 pb-2">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary">
              <Stethoscope className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="font-heading text-base text-cyan-900">
              {name}
            </CardTitle>
            <p className="text-sm text-slate-500">{title}</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Badge variant="secondary" className="text-xs">
            {departmentName}
          </Badge>
          {specialties && specialties.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {specialties.slice(0, 3).map((s) => (
                <Badge key={s} variant="outline" className="text-xs">
                  {s}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
