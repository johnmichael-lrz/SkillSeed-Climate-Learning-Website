import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { MissionDashboard } from "./pages/MissionDashboard";
import { MissionDetail } from "./pages/MissionDetail";
import { ProgressTracker } from "./pages/ProgressTracker";
import { CommunityChallenges } from "./pages/CommunityChallenges";
import { AuthPage } from "./pages/AuthPage";
import { AuthCallback } from "./pages/AuthCallback";
import { ResetPassword } from "./pages/ResetPassword";
import { PostProject } from "./pages/PostProject";
import { FundingResources } from "./pages/FundingResources";
import { EditFunding } from "./pages/EditFunding";
import Academy from "./pages/Academy";
import { HandsOnQuests } from "./pages/HandsOnQuests";
import { QuestDetail } from "./pages/QuestDetail";
import { VerifierDashboard } from "./pages/VerifierDashboard";
import { VerifierLogin } from "./pages/VerifierLogin";
import { VerifierGuard } from "./components/VerifierGuard";

export const router = createBrowserRouter([
  // Verifier portal routes (outside main layout)
  {
    path: "/verifier-login",
    element: <VerifierLogin />,
  },
  {
    path: "/verifier",
    element: (
      <VerifierGuard>
        <VerifierDashboard />
      </VerifierGuard>
    ),
  },
  // Main app routes
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: LandingPage },
      { path: "dashboard", Component: MissionDashboard },
      { path: "browse", Component: MissionDashboard },
      { path: "missions/:id", Component: MissionDetail },
      { path: "progress", Component: ProgressTracker },
      { path: "tracker", Component: ProgressTracker },
      { path: "community", Component: CommunityChallenges },
      { path: "auth", Component: AuthPage },
      { path: "auth/callback", Component: AuthCallback },
      { path: "reset-password", Component: ResetPassword },
      { path: "post-project", Component: PostProject },
      { path: "funding", Component: FundingResources },
      { path: "edit-funding/:fundingId", Component: EditFunding },
      { path: "academy", Component: Academy },
      // Hands-on Quests system
      { path: "hands-on", Component: HandsOnQuests },
      { path: "quests", Component: HandsOnQuests },
      { path: "quests/:questId", Component: QuestDetail },
    ],
  },
]);
