import Script from "next/script";
import Editor from "./editor";

export default function Home() {
  return (
    <>
      <Editor />
      <Script
        src="https://kit.fontawesome.com/410be214c2.js"
        crossOrigin="anonymous"
      ></Script>
    </>
  );
}
