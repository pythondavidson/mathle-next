import PerfilPublico from '../../../components/PerfilPublico';

export default async function Page({ params }) {
  const { username } = await params;
  return <PerfilPublico params={{ username }} />;
}
//hola