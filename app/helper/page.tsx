import RoleStub from '@/components/RoleStub';

export default function Page() {
  return (
    <RoleStub
      title="Helper"
      desc="Claim cases and find shelters"
      slots={['Open cases list (T11)', 'Claim button (T12)', 'Shelter list (T13)', 'Assign case (T14)']}
    />
  );
}