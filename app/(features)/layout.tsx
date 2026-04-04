import FeatureThemeShell from "@/components/layout/FeatureThemeShell";
import NavBar from "@/components/layout/NavBar";

export const dynamic = "force-static";

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FeatureThemeShell>
      <NavBar />
      {children}
    </FeatureThemeShell>
  );
}
