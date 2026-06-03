import { useState } from "react";
import { LoginPage } from "@multica/views/auth";
import { DragStrip } from "@multica/views/platform";
import { MulticaIcon } from "@multica/ui/components/common/multica-icon";
import { Button } from "@multica/ui/components/ui/button";
import { Input } from "@multica/ui/components/ui/input";
import { Label } from "@multica/ui/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@multica/ui/components/ui/dialog";

function requireRuntimeAppUrl(): string {
  const runtimeConfig = window.desktopAPI.runtimeConfig;
  if (!runtimeConfig.ok) {
    throw new Error(
      "Invariant violated: DesktopLoginPage rendered before App accepted runtime config",
    );
  }
  return runtimeConfig.config.appUrl;
}

function ServerConfigDialog() {
  const currentUrl = window.desktopAPI.runtimeConfig.ok
    ? window.desktopAPI.runtimeConfig.config.apiUrl
    : "";
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState(currentUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await window.desktopAPI.updateRuntimeConfig(url.trim());
      if (result.ok) {
        setSaved(true);
      } else {
        setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setUrl(currentUrl);
      setError(null);
      setSaved(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className="mt-3 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">
          配置服务器地址
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>服务器配置</DialogTitle>
          <DialogDescription>
            {saved
              ? "配置已保存，请重启应用以使新配置生效。"
              : "配置自部署的后端 API 地址。保存后需要重启应用才能生效。"}
          </DialogDescription>
        </DialogHeader>
        {saved ? (
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => handleOpenChange(false)}>关闭</Button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="server-api-url">API 地址</Label>
              <Input
                id="server-api-url"
                placeholder="https://api.multica.ai"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                取消
              </Button>
              <Button onClick={handleSave} disabled={saving || !url.trim()}>
                {saving ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function DesktopLoginPage() {
  const webUrl = requireRuntimeAppUrl();
  const handleGoogleLogin = () => {
    window.desktopAPI.openExternal(`${webUrl}/login?platform=desktop`);
  };

  return (
    <div className="flex h-screen flex-col">
      <DragStrip />
      <LoginPage
        logo={<MulticaIcon bordered size="lg" />}
        onSuccess={() => {
          // Auth store update triggers AppContent re-render → shows DesktopShell.
          // Initial workspace navigation happens in routes.tsx via IndexRedirect.
        }}
        onGoogleLogin={handleGoogleLogin}
        extra={<ServerConfigDialog />}
      />
    </div>
  );
}
