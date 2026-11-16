"use client";

import { Globe, Loader2, RefreshCw, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  useDisconnectGithub,
  useGetSettings,
  useResyncWebhooks,
} from "@/hooks/queries/useSettings";
import { AppSettingsLoader } from "@/components/common/AppLoaders";
import AppIcon from "@/components/common/AppIcons";

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "localhost";

const REQUIRED_SCOPES = ["admin:repo_hook", "repo"];

type RowProps = { label: string; value: React.ReactNode };

function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-end font-medium">{value}</span>
    </div>
  );
}

export default function SettingsModule() {
  const { data, isLoading } = useGetSettings();
  const disconnect = useDisconnectGithub();
  const resync = useResyncWebhooks();

  function handleReconnect() {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/github`;
  }

  function handleDisconnect() {
    disconnect.mutate();
  }

  function handleResync() {
    resync.mutate();
  }

  if (isLoading || !data) {
    return <AppSettingsLoader />;
  }

  const { account, github, platform } = data;
  const hasHookScope = REQUIRED_SCOPES.some((scope) =>
    github.scopes.includes(scope),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Settings</h1>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User size={16} /> Account
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          <Row label="Name" value={account.name ?? "-"} />
          <Row label="Email" value={account.email} />
          <Row
            label="Member since"
            value={new Date(account.created_on).toLocaleDateString([], {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <AppIcon type="github" size={16} /> GitHub
            </CardTitle>
            <CardDescription>
              Used to list your repos and register push webhooks
            </CardDescription>
          </div>
          {!github.connected && (
            <Badge variant="secondary">Not connected</Badge>
          )}
          {github.connected && github.valid && (
            <Badge className="bg-emerald-500/10 text-emerald-600 shadow-none dark:text-emerald-400">
              Connected
            </Badge>
          )}
          {github.connected && !github.valid && (
            <Badge className="bg-red-500/10 text-red-600 shadow-none dark:text-red-400">
              Token expired
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {github.valid && (
            <div className="flex items-center gap-3">
              {github.avatar_url && (
                <img
                  src={github.avatar_url}
                  alt={github.login ?? "GitHub avatar"}
                  className="size-10 rounded-full"
                />
              )}
              <div className="text-sm">
                <p className="font-medium">{github.login}</p>
                <p className="text-muted-foreground">
                  Scopes:{" "}
                  {github.scopes.length ? github.scopes.join(", ") : "-"}
                </p>
              </div>
            </div>
          )}

          {github.valid && github.scopes.length > 0 && !hasHookScope && (
            <p className="rounded-md bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-400">
              Missing the admin:repo_hook or repo scope, so auto deploy cannot
              create webhooks. Reconnect and approve the permissions.
            </p>
          )}

          {github.connected && !github.valid && (
            <p className="rounded-md bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">
              GitHub rejected the stored token. Reconnect to restore repo access
              and auto deploy.
            </p>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleReconnect}>
              {github.connected ? "Reconnect" : "Connect GitHub"}
            </Button>
            {github.connected && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending && (
                  <Loader2 size={14} className="mr-1 animate-spin" />
                )}
                Disconnect
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-xs">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe size={16} /> Platform
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-border">
            <Row label="Base domain" value={`*.${BASE_DOMAIN}`} />
            <Row
              label="Webhook URL base"
              value={platform.public_api_url ?? "Not set"}
            />
            <Row
              label="Webhook reachability"
              value={
                platform.webhook_ready ? (
                  <Badge variant="secondary">Public URL set</Badge>
                ) : (
                  <Badge className="bg-red-500/10 text-red-600 shadow-none dark:text-red-400">
                    Not public
                  </Badge>
                )
              }
            />
            <Row label="Services" value={platform.services.total} />
            <Row label="Auto deploy on" value={platform.services.auto_deploy} />
            <Row
              label="Webhooks registered"
              value={platform.services.webhooks}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleResync}
              disabled={
                resync.isPending || !platform.webhook_ready || !github.valid
              }
            >
              {resync.isPending ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <RefreshCw size={14} className="mr-1" />
              )}
              Re-sync webhooks
            </Button>
            {resync.isSuccess && (
              <span className="text-sm text-muted-foreground">
                {resync.data?.message}
              </span>
            )}
            {resync.isError && (
              <span className="text-sm text-destructive">Re-sync failed</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
