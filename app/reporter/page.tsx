import RoleStub from '@/components/RoleStub';

export default function Page() {
  return (
    <RoleStub
      title="Reporter"
      desc="Report someone who needs help"
      slots={['Report form (T9)', 'Status page (T10)']}
    />
  );
}