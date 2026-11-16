interface CommonFields {
  name: string;
  slug: string;
  deploy_type: number;
  type: string;
  project_id: string;
  port: number;
}

export interface GitHubFormValues extends CommonFields {
  repo_type: number;
  repo_id: number | null;
  repo_full_name: string;
  branch: string;
  root_directory: string;
  use_dockerfile: boolean;
  auto_deploy: boolean;
  runtime: number;
  build_command: string;
  start_command: string;
  output_directory: string;
  env_vars: { key: string; value: string }[];
}

export interface DockerFormValues extends CommonFields {
  image_url: string;
}

export type Props = {
  id: string;
  type: string;
};

export interface DockerProps extends Props {
  isEdit: boolean;
  editData?: DockerFormValues;
  service_id?: string;
}

export interface GithubProps extends Props {
  isEdit: boolean;
  editData?: GitHubFormValues;
  service_id?: string;
}
