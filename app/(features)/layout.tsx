import NavBar from "@/components/layout/NavBar";

export const dynamic = "force-static";

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
