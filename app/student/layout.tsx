import StudentNavbar from "@/components/student/StudentNavbar";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6f9",
      }}
    >
      <StudentNavbar />

      <main
        style={{
          width: "100%",
          minHeight: "calc(100vh - 76px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}