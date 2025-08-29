
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { mergeImages, MergeResult } from './services/geminiService';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { SparklesIcon } from './components/icons/SparklesIcon';

type AppStep = 'upload' | 'loading' | 'result' | 'error';

const App: React.FC = () => {
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [individualImage, setIndividualImage] = useState<File | null>(null);
  const [mergedImage, setMergedImage] = useState<string | null>(null);
  const [aiResponseText, setAiResponseText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<AppStep>('upload');

  const handleMerge = useCallback(async () => {
    if (!groupImage || !individualImage) {
      setError('Please upload both a group photo and an individual photo.');
      setStep('error');
      return;
    }
    setError(null);
    setStep('loading');

    try {
      const result: MergeResult = await mergeImages(groupImage, individualImage);
      setMergedImage(result.imageUrl);
      setAiResponseText(result.textResponse);
      setStep('result');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to merge images. ${errorMessage}`);
      setStep('error');
    }
  }, [groupImage, individualImage]);

  const handleReset = () => {
    setGroupImage(null);
    setIndividualImage(null);
    setMergedImage(null);
    setError(null);
    setAiResponseText(null);
    setStep('upload');
  };

  const renderContent = () => {
    switch (step) {
      case 'upload':
        return (
          <div className="w-full max-w-4xl animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <ImageUploader
                id="group-photo"
                label="Group Photo (The Base Image)"
                onImageUpload={setGroupImage}
                file={groupImage}
              />
              <ImageUploader
                id="individual-photo"
                label="Individual to Add"
                onImageUpload={setIndividualImage}
                file={individualImage}
              />
            </div>
            <button
              onClick={handleMerge}
              disabled={!groupImage || !individualImage}
              className="w-full bg-brand-primary hover:bg-brand-secondary disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg text-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <SparklesIcon />
              Merge Photos
            </button>
          </div>
        );
      case 'loading':
        return (
          <div className="text-center animate-fade-in p-8 bg-slate-800 rounded-lg shadow-xl">
            <SpinnerIcon className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-brand-secondary">Creating Magic...</h2>
            <p className="text-slate-400">The AI is analyzing the images and finding the perfect spot. This can take a moment.</p>
          </div>
        );
      case 'result':
        return (
          <div className="w-full max-w-4xl text-center animate-slide-up">
            <h2 className="text-3xl font-bold mb-4 text-brand-secondary">
              {mergedImage ? 'Merge Successful!' : 'AI Feedback'}
            </h2>
            <p className="text-slate-400 mb-8">
              {mergedImage ? 'Here is your new group photo.' : 'The AI could not merge the images and provided this feedback:'}
            </p>
            {mergedImage && (
              <>
                <img
                  src={mergedImage}
                  alt="Merged group"
                  className="rounded-lg shadow-2xl w-full object-contain max-h-[60vh] mb-8"
                />
                <p className="text-sm text-slate-500 mt-4 -mb-4 italic max-w-lg mx-auto">
                    Tip: Not the result you expected? Try using photos with similar lighting and resolution for a better blend.
                </p>
              </>
            )}
            {aiResponseText && (
              <div className="text-left bg-slate-800 p-4 rounded-lg my-8 animate-fade-in">
                <h3 className="font-semibold text-lg text-slate-300 mb-2">AI Response:</h3>
                <p className="text-slate-400 whitespace-pre-wrap font-mono text-sm">{aiResponseText}</p>
              </div>
            )}
            <button
              onClick={handleReset}
              className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300"
            >
              Start Over
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="w-full max-w-2xl text-center animate-fade-in p-8 bg-red-900/50 border border-red-700 rounded-lg">
            <h2 className="text-2xl font-bold text-red-400 mb-4">An Error Occurred</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button
              onClick={handleReset}
              className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-300"
            >
              Try Again
            </button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-cyan-400">
            Group Photo Merge AI
          </span>
        </h1>
        <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
          Never miss a group photo again. Add anyone to your picture seamlessly with the power of AI.
        </p>
      </header>
      <main className="w-full flex items-center justify-center">
        {renderContent()}
      </main>
      <footer className="text-center text-slate-500 mt-12">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
