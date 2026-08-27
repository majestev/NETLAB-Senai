"use client";

import { DEMO_ROUTES } from "@/lib/net/routing-demo";
import { CamStory } from "./cam-story";
import { Dot1qVisual } from "./dot1q-visual";
import { EncapsulationVisual } from "./encapsulation-visual";
import { CliModes, GuiVsCli } from "./interface-visual";
import { PrefixMatchVisual } from "./prefix-match-visual";
import { RoutingTableExplorer } from "./routing-table-explorer";
import { VlsmSplitVisual } from "./vlsm-split-visual";
import { VlsmWorkedExample } from "./vlsm-worked-example";
import {
  SignalMeter,
  WirelessAssociation,
  WirelessSpectrum,
} from "./wireless-visual";

export type LessonVisualKind =
  | "prefix-match"
  | "vlsm-split"
  | "encapsulation"
  | "cam-story"
  | "dot1q"
  | "wireless-assoc"
  | "wireless-spectrum"
  | "cli-modes"
  | "gui-vs-cli"
  | "routing-table"
  | "vlsm-worked";

export function LessonVisual({ kind }: { kind: LessonVisualKind }) {
  switch (kind) {
    case "prefix-match":
      return <PrefixMatchVisual destination={0x0a010105} routes={DEMO_ROUTES} />;
    case "vlsm-split":
      return <VlsmSplitVisual />;
    case "encapsulation":
      return <EncapsulationVisual />;
    case "cam-story":
      return <CamStory />;
    case "dot1q":
      return <Dot1qVisual />;
    case "wireless-assoc":
      return <WirelessAssociation />;
    case "wireless-spectrum":
      return (
        <div className="space-y-3">
          <WirelessSpectrum />
          <SignalMeter />
        </div>
      );
    case "cli-modes":
      return <CliModes />;
    case "gui-vs-cli":
      return <GuiVsCli />;
    case "routing-table":
      return <RoutingTableExplorer />;
    case "vlsm-worked":
      return <VlsmWorkedExample />;
  }
}
