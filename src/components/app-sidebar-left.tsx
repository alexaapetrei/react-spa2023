import { useState } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, ChevronDown, Globe2, Home, Moon, Share2, SquarePen, Sun, X } from "lucide-react";
import { langs } from "../i18n";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import { Social } from "./social";
import { HomeActions } from "./home-actions";
import { useTheme } from "./ui/use-theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

/**
 * Left rail: where you can go.
 *
 * Navigation only — quiz progress lives in the right rail.
 *
 * Below `md` this rail is an overlay rather than a persistent column, so every
 * link dismisses it as part of the same tap. Otherwise it stays on top of the
 * page you just navigated to.
 */
export function AppSidebarLeft() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { setOpenMobile, state: sidebarState } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const [shareOpen, setShareOpen] = useState(false);

  /** No-op on desktop, where this rail is a persistent column. */
  const dismissIfOverlay = () => setOpenMobile(false);

  const handleLanguageChange = (language: string) => {
    if (language === i18n.language) return;
    i18n.changeLanguage(language);
    router.invalidate();
  };

  return (
    <>
      <Sidebar side="left" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu className="gap-2">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild tooltip="UrsSur">
                <Link to="/" onClick={dismissIfOverlay}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                    <img src="/bear2023.svg" alt="" className="size-6" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">UrsSur</span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {t("nav.tagline")}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip={t("common.language")}>
                    <Globe2 />
                    <span>{langs[i18n.language] ?? langs.ro}</span>
                    <ChevronDown className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="bottom" className="min-w-40">
                  <DropdownMenuRadioGroup
                    value={i18n.language}
                    onValueChange={handleLanguageChange}
                  >
                    {Object.entries(langs).map(([code, label]) => (
                      <DropdownMenuRadioItem key={code} value={code}>
                        {label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <div
                role="group"
                aria-label={t("nav.theme")}
                className="grid grid-cols-2 gap-1 rounded-xl border bg-muted/70 p-1 group-data-[collapsible=icon]:grid-cols-1 group-data-[collapsible=icon]:gap-0.5 group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0"
              >
                <button
                  type="button"
                  aria-pressed={resolvedTheme === "light"}
                  aria-label={t("nav.light")}
                  title={t("nav.light")}
                  onClick={() => setTheme("light")}
                  className={`flex min-h-9 min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:min-h-8 group-data-[collapsible=icon]:px-0 ${
                    resolvedTheme === "light"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Sun className="size-4 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">
                    {t("nav.light")}
                  </span>
                </button>
                <button
                  type="button"
                  aria-pressed={resolvedTheme === "dark"}
                  aria-label={t("nav.dark")}
                  title={t("nav.dark")}
                  onClick={() => setTheme("dark")}
                  className={`flex min-h-9 min-w-0 items-center justify-center gap-2 rounded-lg px-2 text-sm font-medium transition-colors group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:min-h-8 group-data-[collapsible=icon]:px-0 ${
                    resolvedTheme === "dark"
                      ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Moon className="size-4 shrink-0" />
                  <span className="truncate group-data-[collapsible=icon]:hidden">
                    {t("nav.dark")}
                  </span>
                </button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === "/"} tooltip={t("common.home")}>
                    <Link to="/" onClick={dismissIfOverlay}>
                      <Home />
                      <span>{t("common.home")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      pathname === "/sets" ||
                      pathname.startsWith("/categoria/") ||
                      pathname.startsWith("/retake/")
                    }
                    tooltip={t("nav.sets")}
                  >
                    <Link to="/sets" onClick={dismissIfOverlay}>
                      <BookOpen />
                      <span>{t("nav.sets")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu className="gap-2">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/intrebari")}
                    tooltip={t("nav.myQuestions")}
                  >
                    <Link to="/intrebari" onClick={dismissIfOverlay}>
                      <SquarePen />
                      <span>{t("nav.myQuestions")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      setShareOpen(true);
                      dismissIfOverlay();
                    }}
                    tooltip={t("nav.share")}
                  >
                    <Share2 />
                    <span>{t("nav.share")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator className="mx-0" />
          <HomeActions
            compact={sidebarState === "collapsed"}
            showUpdate={false}
            onReset={dismissIfOverlay}
          />
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <Dialog.Root open={shareOpen} onOpenChange={setShareOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,36rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-5 shadow-lg">
            <Dialog.Title className="sr-only">{t("common.share")}</Dialog.Title>
            <Dialog.Description className="sr-only">{t("common.disourage")}</Dialog.Description>
            <Dialog.Close
              className="absolute right-3 top-3 rounded-md p-2 opacity-70 transition-opacity hover:bg-accent hover:opacity-100"
              aria-label={t("common.cancel")}
            >
              <X className="size-4" />
            </Dialog.Close>
            <Social />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
