import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PhotosClient } from "@/components/dashboard/PhotosClient";

export const metadata = {
  title: "Galerie du Chantier | AGEM TrackPro",
  description: "Suivi visuel et chronologique du chantier",
};

export default async function PhotosPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const project = await prisma.project.findUnique({
    where: { code: "OBF-SIEGE-2026" },
  });

  if (!project) redirect("/dashboard");

  const photos = await prisma.sitePhoto.findMany({
    where: { projectId: project.id },
    orderBy: { takenAt: "desc" },
    include: {
      takenBy: {
        select: {
          id: true,
          fullName: true,
          role: true,
        }
      },
      annotations: {
        include: {
          author: {
            select: {
              fullName: true,
            }
          }
        }
      }
    }
  });

  const formattedPhotos = photos.map(p => ({
    id: p.id,
    zone: p.zone,
    caption: p.caption,
    fileUrl: p.fileUrl,
    thumbnailUrl: p.thumbnailUrl,
    takenAt: p.takenAt.toISOString(),
    takenBy: {
      name: p.takenBy.fullName,
      role: p.takenBy.role,
    },
    tags: p.tags,
    annotations: p.annotations.map(a => ({
      id: a.id,
      authorName: a.author.fullName,
      content: a.content,
      posX: a.posX,
      posY: a.posY,
      createdAt: a.createdAt.toISOString()
    }))
  }));

  return <PhotosClient photos={formattedPhotos} userRole={session.user.role} />;
}
