import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { CreateProject } from './pages/CreateProject';
import { ImportProject } from './pages/ImportProject';
import { ProjectEditor } from './pages/ProjectEditor';
import { useEffect } from 'react';

// Snapshot component to handle redirect
const SnapshotRedirect = () => {
  const lastPath = localStorage.getItem('lastPath');
  // If there is a last path, redirect to it.
  // Otherwise, render Home.
  if (lastPath && lastPath !== '/') {
      return <Navigate to={lastPath} replace />;
  }
  return <Home />;
};

// Component to track location changes
const LocationTracker = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only save path if it is NOT root.
    // Because if user is at root, we don't need to "restore" it, 
    // root is the default fallback.
    // Also user said "no jumping to home", so we assume they want to stay on feature pages.
    if (location.pathname !== '/') {
        localStorage.setItem('lastPath', location.pathname);
    }
  }, [location]);
  
  return null;
};

function App() {
  return (
    <ChakraProvider>
      <BrowserRouter>
        <LocationTracker />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<SnapshotRedirect />} />
            <Route path="projects" element={<Projects />} />
            <Route path="projects/create" element={<CreateProject />} />
            <Route path="projects/import" element={<ImportProject />} />
            <Route path="projects/:id" element={<ProjectEditor />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
