import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getPatientReviews } from "@/server/actions/review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

export default async function PatientReviewsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const result = await getPatientReviews(session.user.id);
  const reviews = result.success ? result.data : [];

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl font-bold text-cyan-900">我的评价</h1>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">暂无评价</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {review.doctor.user.name} - {review.doctor.department.name}
                  </CardTitle>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {review.comment && (
                  <p className="text-sm text-slate-600">{review.comment}</p>
                )}
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(review.createdAt).toLocaleDateString("zh-CN")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
