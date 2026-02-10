export function Footer() {
  return (
    <footer className="border-t-2 border-foreground py-8 mt-16">
      <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
        <p className="font-mono">TonariMate &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
