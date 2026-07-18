import { BamApp } from "@/components/comic/bam-app";
import { BangProvider } from "@/components/comic/bang-effect";

export default function Home() {
  return (
    <BangProvider>
      <BamApp />
    </BangProvider>
  );
}
