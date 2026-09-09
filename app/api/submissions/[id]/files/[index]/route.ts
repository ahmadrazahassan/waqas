import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; index: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse(null,{status:401});
  if (!hasServiceRole()) return new NextResponse(null,{status:503});
  const { id,index } = await params;
  if (!z.string().uuid().safeParse(id).success || !/^\d{1,2}$/.test(index)) return new NextResponse(null,{status:404});
  const admin = createAdminClient();
  const { data: submission } = await admin.from("submissions").select("user_id,file_paths").eq("id",id).maybeSingle();
  const reviewer = user.profile.status === "active" && user.roles.some(r=>["reviewer","admin","owner"].includes(r));
  if (!submission || (submission.user_id !== user.id && !reviewer)) return new NextResponse(null,{status:404});
  const path = submission.file_paths[Number(index)];
  if (!path || !path.startsWith(`${submission.user_id}/`) || path.includes("..")) return new NextResponse(null,{status:404});
  const { data,error } = await admin.storage.from("submissions").createSignedUrl(path,60,{download:true});
  if (error || !data) return new NextResponse(null,{status:404});
  return NextResponse.redirect(data.signedUrl,{status:303,headers:{"Cache-Control":"private, no-store","Referrer-Policy":"no-referrer"}});
}
