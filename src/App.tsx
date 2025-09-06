import React from 'react';
import { AppProvider } from './contexts/AppContext';
import { ToastProvider } from './components/UI/Toast';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Editor } from './components/Editor/Editor';
import { Preview } from './components/Preview/Preview';

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-gray-100 flex flex-col">
          <Header />
          
          <div className="flex-1 flex">
            <Sidebar />
            
            <div className="flex-1 flex">
              <Editor />
              <Preview />
            </div>
          </div>
        </div>
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
