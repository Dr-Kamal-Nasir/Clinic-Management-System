import ClinicLoadingAnimation from "@/components/ClinicLoadingAnimation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col columns-2 gap-[32px] row-start-2 items-center sm:items-start">
       <ClinicLoadingAnimation/>
       <div className=" flex justify-center items-center space-x-8">
       <Button className=""><Link href="/login">Go Back to Login</Link> </Button>
       <Button className=""><Link href="/login">Or GO to Register </Link> </Button>
       </div>
      </main>
       
    </div>
  );
}
