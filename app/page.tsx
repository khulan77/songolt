import { existsSync } from "node:fs";
import { join } from "node:path";
import BookExperience from "@/components/BookExperience";

// Asset байхгүй бол тухайн функцийг нууна (build үед шалгана)
const pub = (p: string) => existsSync(join(process.cwd(), "public", p));

export default function Home() {
  return <BookExperience hasCover={pub("cover.png")} hasAudio={pub("audio/piano.mp3")} />;
}
