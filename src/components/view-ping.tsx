"use client";

import { useEffect } from "react";

/** Records one view per browser session per article (dedupe via sessionStorage). */
export function ViewPing({ articleId }: { articleId: string }) {
  useEffect(() => {
    const key = `viewed:${articleId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // private mode / storage disabled — just ping once per mount
    }
    fetch(`/api/articles/${articleId}/view`, { method: "POST", keepalive: true }).catch(
      () => {},
    );
  }, [articleId]);

  return null;
}
