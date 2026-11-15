"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/** Deep-link legado → modal em /foco */
export default function SolutionRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    if (id) router.replace(`/foco?sol=${id}`);
  }, [id, router]);

  return <p className="rm-muted">A abrir…</p>;
}
