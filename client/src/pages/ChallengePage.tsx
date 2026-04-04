import { useParams } from 'react-router-dom';

const ChallengePage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold text-white">ChallengePage</h1>
        <p className="text-on-surface-muted mt-2">Challenge ID: {id}</p>
      </div>
    </div>
  );
};

export default ChallengePage;
