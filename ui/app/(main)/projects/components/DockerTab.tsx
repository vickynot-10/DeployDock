"use client";

import { useForm, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import FieldRow from "./FieldRow";
import { DEPLOY_TYPE } from "@/constants";
import { AppButton } from "@/components/common/AppButton";
import { useRouter } from "next/navigation";

import { generateSlug, validateSlug } from "@/lib/genertateSlug";
import { DockerFormValues, DockerProps, Props } from "@/types/services.types";
import { useSaveService } from "@/hooks/queries/useServices";
import { useEffect } from "react";
import { useEditService } from "../../../../hooks/queries/useServices";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "localhost";
export default function DockerTab({
  id,
  type,
  isEdit,
  editData,
  service_id,
}: DockerProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
    control,
    reset,
  } = useForm<DockerFormValues>({
    defaultValues: { image_url: "", name: "", slug: "", port: 3000 },
  });

  useEffect(() => {
    if (!isEdit || !editData || !service_id) return;
    reset(editData);
  }, [isEdit, editData]);

  const projectName = useWatch({ control, name: "name" });
  const projectSlug = useWatch({ control, name: "slug" });

  const router = useRouter();

  const { mutate, isPending } = useSaveService();
  const { mutate: editService, isPending: isEditing } = useEditService();
  function GoBack() {
    router.push(`/projects/${id}`);
  }

  useEffect(() => {
    if (dirtyFields.slug) return;
    setValue("slug", generateSlug(projectName ?? ""));
  }, [projectName, dirtyFields.slug, setValue]);

  async function handleValidSubmit(values: DockerFormValues) {
    const payload = {
      name: values.name,
      image_url: values.image_url,
      deploy_type: DEPLOY_TYPE.DOCKER,
      type,
      slug: values.slug,
      project_id: id,
      port: values.port,
    };

    if (isEdit && service_id) {
      (payload as any).service_id = service_id;
      editService(payload, {
        onSuccess: (res) => {
          if (res?.success) {
            GoBack();
          }
        },
      });
      return;
    }

    mutate(payload, {
      onSuccess: (res) => {
        if (res?.success) {
          GoBack();
        }
      },
    });
  }

  return (
    <div className="w-full space-y-6">
      <form onSubmit={handleSubmit(handleValidSubmit)} className="w-full">
        <div className="w-full space-y-6 pb-6">
          <FieldRow
            label="Name"
            description="A Name for Site"
            htmlFor="site_name"
          >
            <Input
              id="site_name"
              placeholder="Portfolio"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </FieldRow>

          <FieldRow
            label="Sub Domain"
            description="Your site will be available at this address"
            htmlFor="slug"
          >
            <Input
              id="slug"
              placeholder="my-app"
              {...register("slug", {
                required: "Sub Domain is required",
                validate: (value) => validateSlug(value) ?? true,
              })}
            />
            {projectSlug && (
              <p className="text-sm text-muted-foreground">
                {projectSlug}.{BASE_DOMAIN}
              </p>
            )}
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
          </FieldRow>

          <FieldRow
            label="Port"
            description="The port your app listens on inside the container"
            htmlFor="port"
          >
            <Input
              id="port"
              type="number"
              placeholder="3000"
              {...register("port", {
                required: "Port is required",
                valueAsNumber: true,
                min: { value: 1, message: "Port must be between 1 and 65535" },
                max: {
                  value: 65535,
                  message: "Port must be between 1 and 65535",
                },
              })}
            />
            {errors.port && (
              <p className="text-sm text-destructive">{errors.port.message}</p>
            )}
          </FieldRow>

          <FieldRow
            label="Image URL"
            description="Deploy an image from a Docker registry"
            htmlFor="image_url"
          >
            <Input
              id="image_url"
              type="text"
              placeholder="docker.io/library/nginx:latest"
              {...register("image_url", {
                required: "Image URL is required",
              })}
            />
            {errors.image_url && (
              <p className="text-sm text-destructive">
                {errors.image_url.message}
              </p>
            )}
          </FieldRow>

          <div className="sticky bottom-0  z-10 flex items-center justify-end gap-2 bg-background py-5">
            <AppButton
              variant="secondary"
              type="button"
              idleLabel="Cancel"
              isLoading={isPending || isEditing}
              disabled={isPending || isEditing}
              onClick={GoBack}
              className=" min-w-30     py-6"
            />

            <AppButton
              idleLabel={
                service_id
                  ? "Save Changes and Deploy Site"
                  : "Save and Deploy Site"
              }
              className=" min-w-30 py-6"
              isLoading={isPending || isEditing}
              disabled={isPending || isEditing}
              type="submit"
              loadingLabel="Deploying..."
              successLabel="Started"
            />
          </div>
        </div>
      </form>
    </div>
  );
}
