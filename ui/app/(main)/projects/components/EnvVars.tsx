"use client";
import { useRef } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GitHubFormValues } from "./GithubInputs";
import AppIconButton from "@/components/common/AppIconButton";

type EnvVar = { key: string; value: string };

function parseEnv(text: string): EnvVar[] {
  const result: EnvVar[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const cleaned = line.replace(/^export\s+/, "");
    const eqIndex = cleaned.indexOf("=");
    if (eqIndex < 1) continue;

    const key = cleaned.slice(0, eqIndex).trim();
    let value = cleaned.slice(eqIndex + 1).trim();

    const quoted = /^(["'])(.*)\1$/.exec(value);
    if (quoted) {
      value = quoted[2];
    } else {
      value = value.replace(/\s+#.*$/, "");
    }

    result.push({ key, value });
  }

  return result;
}

export function EnvVarsField() {
  const { register, control, getValues } = useFormContext<GitHubFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "env_vars",
  });
  const fileRef = useRef<HTMLInputElement>(null);

  function AddNew() {
    append({
      key: "",
      value: "",
    });
  }

  function mergeVars(incoming: EnvVar[]) {
    const merged = getValues("env_vars").filter(
      (v) => v.key.trim() || v.value.trim(),
    );

    for (const item of incoming) {
      const index = merged.findIndex((v) => v.key === item.key);
      if (index >= 0) merged[index] = item;
      else merged.push(item);
    }

    replace(merged);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    mergeVars(parseEnv(text));
    e.target.value = "";
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text.includes("=")) return;
    const parsed = parseEnv(text);
    if (parsed.length === 0) return;
    e.preventDefault();
    mergeVars(parsed);
  }

  return (
    <div className="w-full space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label className="text-sm font-semibold">Environment variables</Label>
          <p className="text-sm text-muted-foreground">
            Available at build time. Paste KEY=VALUE lines or import a .env file
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".env,.txt,text/plain"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="size-4" />
            Import .env
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={AddNew}>
            <Plus className="size-4" />
            Add variable
          </Button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input
                placeholder="KEY"
                className="font-mono"
                onPaste={handlePaste}
                {...register(`env_vars.${index}.key`)}
              />
              <Input
                placeholder="value"
                className="font-mono"
                {...register(`env_vars.${index}.value`)}
              />

              <AppIconButton
                icon={<Plus className="size-4" />}
                type="button"
                variant="ghost"
                onClick={AddNew}
              />

              <AppIconButton
                icon={<Trash2 className="size-4" />}
                type="button"
                variant="ghost"
                onClick={() => remove(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
