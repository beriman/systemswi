// Layout khusus untuk halaman login - tanpa header/footer public
export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // This layout overrides the parent (public) layout
    // to show login page without header/footer
    return <div className="min-h-screen">{children}</div>;
}
