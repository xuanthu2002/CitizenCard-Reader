import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import AddSample from './components/AddSample';
import Sample from './components/Sample';
import Samples from './components/Samples';

function App() {
    return (
        <Router>
            <Routes>
                <Route path={'/samples'} element={<Samples />} />
                <Route path={'/sample/:id'} element={<Sample />} />
                <Route path={'/add-sample'} element={<AddSample />} />
                <Route path={'/update-sample/:id'} element={<AddSample />} />
            </Routes>
        </Router>
    );
}

export default App;
