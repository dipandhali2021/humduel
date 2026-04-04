import { useParams } from 'react-router-dom';

const ResultPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="font-headline text-4xl font-bold text-white">ResultPage</h1>
        <p className="text-on-surface-muted mt-2">Result for challenge: {id}</p>
      </div>
    </div>
  );
};

export default ResultPage;
