import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { hasPermission } from "@/lib/permissions";
import { DocumentsPageClient } from "@/components/documents/DocumentsPageClient";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (!hasPermission(session.user.role, "documents", "view")) {
    return <div className="p-6"><p style={{ color: "var(--status-danger)" }}>Accès non autorisé.</p></div>;
  }

  const project = await prisma.project.findUnique({ where: { code: "OBF-SIEGE-2026" } });
  if (!project) redirect("/dashboard");

  const canUpload = hasPermission(session.user.role, "documents", "create");

  const rawFolders = await prisma.folder.findMany({
    where: { projectId: project.id },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { fullName: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  type FolderNode = {
    id: string;
    name: string;
    path: string;
    parentId: string | null;
    documents: Array<{
      id: string;
      name: string;
      mimeType: string;
      sizeBytes: number;
      version: number;
      uploadedBy: string;
      createdAt: string;
      url: string;
    }>;
    children: FolderNode[];
  };

  const folderMap = new Map<string, FolderNode>();
  for (const f of rawFolders) {
    folderMap.set(f.id, {
      id: f.id,
      name: f.name,
      path: f.name,
      parentId: f.parentId,
      documents: f.documents.map((d) => ({
        id: d.id,
        name: d.name,
        mimeType: d.fileType,
        sizeBytes: d.fileSize,
        version: d.version,
        uploadedBy: d.uploadedBy.fullName,
        createdAt: d.createdAt.toISOString(),
        url: d.fileUrl,
      })),
      children: [],
    });
  }

  const roots: FolderNode[] = [];
  for (const f of rawFolders) {
    const node = folderMap.get(f.id)!;
    if (f.parentId && folderMap.has(f.parentId)) {
      folderMap.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 57px)" }}>
      <div
        className="px-4 lg:px-6 py-4 border-b shrink-0"
        style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-card)" }}
      >
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          GED - Gestion Électronique des Documents
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Arborescence documentaire du projet OBF-SIEGE-2026
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <DocumentsPageClient
          rootFolders={roots}
          canUpload={canUpload}
          projectId={project.id}
        />
      </div>
    </div>
  );
}
