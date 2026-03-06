import NavigationBar from "@/components/NavigationBar";
import { Children } from "react";

export default function Home(children: React.ReactNode) {
  return <NavigationBar>{children}</NavigationBar>;
}

