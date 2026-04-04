import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import PageContainer from '@/components/layout/PageContainer';
import { AudioRecorder } from '@/components/audio/AudioRecorder';

const RecordingPage = () => {
  const navigate = useNavigate();

  const handleRecordingComplete = useCallback(
    (_blob: Blob, _waveformData: number[]) => {
      // In Sprint 2 this will navigate to challenge creation.
      // For now, navigate back home after a successful recording.
      navigate('/');
    },
    [navigate],
  );

  return (
    <>
      <Header title="New Challenge" showBack onBack={() => navigate('/')} />
      <PageContainer>
        <div className="pt-8">
          <AudioRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      </PageContainer>
    </>
  );
};

export default RecordingPage;
