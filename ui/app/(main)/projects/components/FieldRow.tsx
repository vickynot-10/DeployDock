import { Label } from "@/components/ui/label";

type Props = {
  label: string;
  description?: string;
  htmlFor?: string;
  children: React.ReactNode;
};

export default function FieldRow({
  label,
  description,
  htmlFor,
  children,
}: Props) {
  return (
    <div className="grid items-start gap-4 md:grid-cols-[30%_70%]">
      <div className="space-y-1">
        <Label htmlFor={htmlFor} className="text-sm font-semibold">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
