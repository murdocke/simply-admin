import StudioShell from './components/studio-shell';

export default function StudiosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioShell>{children}</StudioShell>;
}
