import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import getCourseById from "@/sanity/lib/courses/getCourseById";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { getCourseProgress } from "@/sanity/lib/courses/getCourseProgress";
import { checkCourseAccess } from "@/lib/auth";
import { getLessonCompletions } from "@/sanity/lib/lessons/getLessonCompletions";
import { getStudentByClerkId } from "@/sanity/lib/student/getStudentByClerkId";

interface CourseLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    courseId: string;
  }>;
}

export default async function CourseLayout({
  children,
  params,
}: CourseLayoutProps) {
  const user = await currentUser();
  const { courseId } = await params;

  if (!user?.id) {
    return redirect("/");
  }

  const authResult = await checkCourseAccess(user?.id || null, courseId);
  if (!authResult.isAuthorized || !user?.id) {
    return redirect(authResult.redirect!);
  }

  const student = await getStudentByClerkId(user.id);

  if (!student || !student.data) {
    return redirect("/my-courses");
  }

  const [course, progress] = await Promise.all([
    getCourseById(courseId),
    getLessonCompletions(student.data._id, courseId),
  ]);

  if (!course) {
    return redirect("/my-courses");
  }

  return (
    <div className="h-full">
      <Sidebar course={course} completedLessons={progress.completedLessons} courseProgress={progress.courseProgress} />
      <main className="h-full lg:pt-[64px] pl-20 lg:pl-96">{children}</main>
    </div>
  );
}