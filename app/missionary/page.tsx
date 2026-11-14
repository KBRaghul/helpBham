import RoleStub from '@/components/RoleStub';

export default function Page() {
  return (
    <RoleStub
      title="Missionary"
      desc="Update shelter bed counts"
      slots={['Bed counter (T15)', 'Last updated and stale shelters (T16)']}
    />
  );
}