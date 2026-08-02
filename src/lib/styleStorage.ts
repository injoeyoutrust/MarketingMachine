import type { Style, StyleCategory, StyleExample } from "./styleLibrary";

export async function loadStyles(): Promise<Style[]> {
  const res = await fetch("/api/styles");
  if (!res.ok) return [];
  const data = await res.json();
  return data.styles as Style[];
}

export async function addStyle(style: {
  category: StyleCategory;
  name: string;
  description: string;
}): Promise<Style | null> {
  const res = await fetch("/api/styles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(style),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.style as Style;
}

export async function deleteStyle(id: string): Promise<void> {
  await fetch(`/api/styles/${id}`, { method: "DELETE" });
}

async function patchStyle(id: string, patch: Partial<Pick<Style, "name" | "description" | "examples">>) {
  await fetch(`/api/styles/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function addExample(style: Style, example: StyleExample): Promise<void> {
  await patchStyle(style.id, { examples: [...style.examples, example] });
}

export async function removeExample(style: Style, exampleId: string): Promise<void> {
  await patchStyle(
    style.id,
    { examples: style.examples.filter((e) => e.id !== exampleId) }
  );
}
