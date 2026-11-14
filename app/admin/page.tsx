import RoleStub from '@/components/RoleStub';

export default function Page() {
  return (
    <RoleStub
      title="Admin"
      desc="See cases, beds and gaps"
      slots={['Admin map (T17)', 'Cases, beds and bed gap (T18)', 'Flag review (T19)']}
    />
  );
}